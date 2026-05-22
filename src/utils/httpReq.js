const mod = 'http'

// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import axios from 'axios'
import { randomUUID } from 'crypto'

// -------------------------------------------------------------------------------------------------
// Debug axios
// -------------------------------------------------------------------------------------------------
// if (getEnvironment() === ENV_LOCAL) {
//   const AxiosCurlirize = await import('axios-curlirize')
//   AxiosCurlirize(axios)
// }
// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { USER_AGENT } from '../config/constApi.js'
// import { ENV_LOCAL } from '../config/appOptions.js'
import { beautify, isNotEmptyArray } from './jsUtils.js'
// import { getEnvironment } from '../controllers/sysController.js'
import { BadRequestError, RudiError } from './errors.js'
import { logD, logI, logT, logW } from './logging.js'

// -------------------------------------------------------------------------------------------------
// Functions: header treatments
// -------------------------------------------------------------------------------------------------
export const getHeaderRedirectUrls = (req) => {
  if (!req.headers) return
  return req.headers['x-forwarded-for'] || req.headers['X-Forwarded-For']
}

// -------------------------------------------------------------------------------------------------
// Functions: extracting URL parameters (after the quote sign)
// -------------------------------------------------------------------------------------------------
export const getUrlParameters = (reqUrl) => {
  const fun = 'getUrlParameters'
  try {
    logT(mod, fun)
    const splitUrl = reqUrl.split('?')
    if ((splitUrl.length = 1 ?? !splitUrl[1])) return // No parameters found
    if (splitUrl.length > 2)
      throw new BadRequestError('Wrong URL, quote character used several times')

    const extractedUrlParameters = []
    const urlParameterSections = splitUrl[1].split('&')
    urlParameterSections.map((paramSection) => {
      const keyVal = paramSection.split('=')
      if (keyVal.length === 0) return // Empty section
      if (keyVal.length === 1 && !!keyVal[0]) extractedUrlParameters.push(keyVal)
      if (keyVal.length === 2) extractedUrlParameters.push({ [keyVal[0]]: keyVal[1] })
      if (keyVal.length === 3) return // Badly formed section
    })
    return extractedUrlParameters
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

// -------------------------------------------------------------------------------------------------
// Functions: http requests
// -------------------------------------------------------------------------------------------------
const HEADERS = {
  'User-Agent': USER_AGENT,
  'Content-Type': 'application/json',
}
const getHeaders = (jwt) => ({
  headers: {
    ...HEADERS,
    ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
  },
})

export const httpGet = async (destUrl, authorizationToken, reqOpts = {}) => {
  const fun = 'httpGet'
  logT(mod, fun)
  try {
    const headers = getHeaders(authorizationToken)
    reqOpts.headers = headers.headers
    const answer = await directGet(destUrl, reqOpts)
    // logD(mod, fun, `answer: ${beautify(answer.data)}`)
    return answer.data
  } catch (err) {
    throw RudiError.treatCommunicationError(mod, fun, err)
  }
}

export const httpDelete = async (destUrl, authorizationToken, reqOpts = {}) => {
  const fun = 'httpDelete'
  try {
    logT(mod, fun)
    const headers = getHeaders(authorizationToken)
    reqOpts.headers = headers.headers
    const answer = await axios.delete(destUrl, reqOpts)
    logD(mod, fun, `answer: ${beautify(answer.data)}`)
    return answer.data
  } catch (err) {
    throw RudiError.treatCommunicationError(mod, fun, err)
  }
}

export const getWithOpts = async (options, authorizationToken) => {
  const fun = 'getWithOpts'
  logT(mod, fun)
  try {
    const destUrl = `${options.protocol}://${options.hostname}/${options.path}`
    const answer = await httpGet(destUrl, authorizationToken)
    return answer.data
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

export const httpPost = async (destUrl, dataToSend, authorizationToken, reqOpts = {}) => {
  const fun = 'httpPost'
  try {
    logT(mod, fun)
    const headers = getHeaders(authorizationToken)
    reqOpts.headers = headers.headers
    const answer = await directPost(destUrl, dataToSend, reqOpts)

    logD(mod, fun, `answer: ${beautify(answer.data)}`)
    return answer.data
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

export const httpPut = async (destUrl, dataToSend, authorizationToken, reqOpts = {}) => {
  const fun = 'httpPut'
  try {
    logT(mod, fun)
    const headers = getHeaders(authorizationToken)
    reqOpts.headers = headers.headers
    const answer = await directPut(destUrl, dataToSend, reqOpts)
    logD(mod, fun, `answer: ${beautify(answer.data)}`)
    return answer.data
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

const REQ_TIMEOUT_MS = 2000
const MAX_RETRIES = 5
const INITIAL_DELAY_MS = 500

/**
 * Generic Axios request with retry and exponential backoff
 * Only handles retries, backoff, and timeout scaling.
 */
const axiosWithRetry = async (
  axiosConf,
  reqTimeout = REQ_TIMEOUT_MS,
  retries = MAX_RETRIES,
  delay = INITIAL_DELAY_MS,
  idempotencyKey
) => {
  const fun = 'axiosWithRetry'

  const headers = {
    ...axiosConf.headers,
    ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    const attemptTimeout = (Number(reqTimeout) || REQ_TIMEOUT_MS) * (attempt + 1)

    // Exponential backoff with jitter
    const baseBackoff = (Number(delay) || INITIAL_DELAY_MS) * 2 ** attempt
    const jitter = Math.floor(Math.random() * baseBackoff * 0.5) // 0–50% random jitter
    const backoff = baseBackoff + jitter

    logI(
      mod,
      fun,
      `Attempt ${attempt + 1} for ${axiosConf.method?.toUpperCase()} ${axiosConf.url}` +
        ` (timeout: ${(attemptTimeout / 1000).toFixed(2)}s, backoff: ${backoff}ms, idempotency: ${idempotencyKey || 'N/A'})`
    )

    try {
      // eslint-disable-next-line no-await-in-loop
      return await axios({ ...axiosConf, timeout: attemptTimeout, headers })
    } catch (err) {
      const status = err.response?.status
      const shouldRetry = err.code === 'ECONNABORTED' || (status && status >= 500)

      if (!shouldRetry || attempt === retries) throw err

      logI(
        mod,
        fun,
        `Request to ${axiosConf.url} failed${status ? ` with status: ${status}` : ''}. Retrying in ${(backoff / 1000).toFixed(2)}s...`
      )
      // eslint-disable-next-line no-await-in-loop
      await new Promise((res) => setTimeout(res, backoff))
    }
  }
}

/**
 * Minimal wrapper for GET, POST, PUT
 * reqOpts can contain:
 *   - timeout
 *   - retries
 *   - delay
 *   - idempotencyKey
 *   - any other Axios options (headers, params, etc.)
 */
const httpRequest = async (method, url, data = null, reqOpts = {}) => {
  const fun = `direct${method.charAt(0).toUpperCase() + method.slice(1)}`
  logT(mod, fun)

  const {
    timeout = reqOpts.timeout ?? REQ_TIMEOUT_MS,
    retries = reqOpts.retries ?? MAX_RETRIES,
    delay = reqOpts.delay ?? INITIAL_DELAY_MS,
    idempotencyKey = ['post', 'put', 'patch'].includes(method.toLowerCase())
      ? randomUUID()
      : undefined,
    ...axiosOptions
  } = reqOpts

  try {
    const axiosConfig = { method, url, data, ...axiosOptions }
    return await axiosWithRetry(axiosConfig, timeout, retries, delay, idempotencyKey)
  } catch (err) {
    logW(mod, fun, `ERR on ${method} ${url}`)
    throw RudiError.treatCommunicationError(mod, fun, err)
  }
}

// Minimal exported functions
export const directGet = (url, reqOpts) => httpRequest('get', url, null, reqOpts)
export const directPost = (url, data, reqOpts) => httpRequest('post', url, data, reqOpts)
export const directPut = (url, data, reqOpts) => httpRequest('put', url, data, reqOpts)

// -------------------------------------------------------------------------------------------------
// IP Redirections display
// -------------------------------------------------------------------------------------------------

export const extractIpRedirections = (req) => {
  const headers = req.headers
  const redirections = headers['x-forwarded-for'] ?? headers['X-Forwarded-For']
  if (!redirections) return
  if (Array.isArray(redirections)) return redirections
  if (typeof redirections === 'string') return redirections.split(',')
  logD(mod, 'extractIpRedirections', `redirections: ${beautify(redirections)}`)
}

export const extractIpAndRedirections = (req) => {
  const ip = req.ip
  const redirections = extractIpRedirections(req)
  return redirections && isNotEmptyArray(redirections) ? [ip, ...redirections] : [ip]
}

export const createIpRedirectionsMsg = (req) => {
  const headers = req?.headers
  if (!headers) return ''
  const redirections = extractIpRedirections(req)
  return redirections && isNotEmptyArray(redirections) ? ` <- ${redirections.join(' <- ')} ` : ''
}

export const createIpsMsg = (req) => `${req?.ip}${createIpRedirectionsMsg(req)}`
