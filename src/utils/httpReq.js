const mod = 'http'

// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import axios from 'axios'

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
import { logD, logT, logW } from './logging.js'

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
const REQ_TIMEOUT_MS = 4000
const MAX_RETRIES = 3
const INITIAL_DELAY_MS = 900

export const httpGet = async (destUrl, authorizationToken) => {
  const fun = 'httpGet'
  logT(mod, fun)
  try {
    const reqOpts = {
      headers: {
        'User-Agent': USER_AGENT,
        'Content-Type': 'application/json',
      },
    }
    if (authorizationToken) reqOpts.headers.Authorization = `Bearer ${authorizationToken}`

    const answer = await directGet(destUrl, reqOpts)
    // logD(mod, fun, `answer: ${beautify(answer.data)}`)
    return answer.data
  } catch (err) {
    throw RudiError.treatCommunicationError(mod, fun, err)
  }
}

export const httpDelete = async (destUrl, authorizationToken) => {
  const fun = 'httpDelete'
  try {
    logT(mod, fun)

    const reqOpts = {
      headers: {
        'User-Agent': USER_AGENT,
        'Content-Type': 'application/json',
      },
    }
    if (authorizationToken) reqOpts.headers.Authorization = `Bearer ${authorizationToken}`

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

export const httpPost = async (destUrl, dataToSend, authorizationToken) => {
  const fun = 'httpPost'
  try {
    logT(mod, fun)
    const reqOpts = {
      headers: {
        'User-Agent': USER_AGENT,
        'Content-Type': 'application/json',
      },
    }
    if (authorizationToken) reqOpts.headers.Authorization = `Bearer ${authorizationToken}`

    const answer = await directPost(destUrl, dataToSend, reqOpts)

    logD(mod, fun, `answer: ${beautify(answer.data)}`)
    return answer.data
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

export const httpPut = async (destUrl, dataToSend, authorizationToken) => {
  const fun = 'httpPut'
  try {
    logT(mod, fun)
    const reqOpts = {
      headers: {
        'User-Agent': USER_AGENT,
        'Content-Type': 'application/json',
      },
    }
    if (authorizationToken) reqOpts.headers.Authorization = `Bearer ${authorizationToken}`

    const answer = await directPut(destUrl, dataToSend, reqOpts)

    logD(mod, fun, `answer: ${beautify(answer.data)}`)
    return answer.data
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

/**
 * Generic Axios request with retry and exponential backoff
 */
const axiosWithRetry = async (axiosCall, retries = MAX_RETRIES, delay = INITIAL_DELAY_MS) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await axiosCall()
    } catch (err) {
      const shouldRetry =
        err.code === 'ECONNABORTED' || (err.response && err.response.status >= 500)

      if (!shouldRetry || attempt === retries) throw err

      const backoff = delay * 2 ** attempt
      console.warn(`Request failed (attempt ${attempt + 1}). Retrying in ${backoff}ms...`)
      await new Promise((res) => setTimeout(res, backoff))
    }
  }
}

/**
 * Minimal wrapper for GET, POST, PUT
 */
const httpRequest = async (method, url, data = null, reqOpts = {}) => {
  const fun = `direct${method.charAt(0).toUpperCase() + method.slice(1)}`
  logT(mod, fun)

  try {
    const axiosCall = () => axios({ method, url, data, timeout: REQ_TIMEOUT_MS, ...reqOpts })

    const answer = await axiosWithRetry(axiosCall)
    // logHttpAnswer(mod, fun, answer)
    return answer
  } catch (err) {
    logW(mod, fun, beautify(err))
    throw RudiError.treatCommunicationError(mod, fun, err)
  }
}

// Export minimal functions
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
