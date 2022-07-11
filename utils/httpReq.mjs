const mod = 'http'

// ------------------------------------------------------------------------------------------------
// External dependecies
// ------------------------------------------------------------------------------------------------
// import https from 'https'
// import http from 'http'
// import { curlirize } from 'axios-curlirize'
import axios from 'axios'
// curlirize(axios)

// ------------------------------------------------------------------------------------------------
// Internal dependecies
// ------------------------------------------------------------------------------------------------
import { logD, logHttpAnswer, logT } from './logging.mjs'
import { beautify } from './jsUtils.mjs'

import { RudiError, BadRequestError } from './errors.mjs'

// ------------------------------------------------------------------------------------------------
// Functions: header treatments
// ------------------------------------------------------------------------------------------------
export const getHeaderRedirectUrls = (req) => {
  if (!req.headers) return
  return req.headers['x-forwarded-for'] || req.headers['X-Forwarded-For']
}

// ------------------------------------------------------------------------------------------------
// Functions: extracting URL parameters (after the quote sign)
// ------------------------------------------------------------------------------------------------
export const getUrlParameters = (reqUrl) => {
  const fun = 'getUrlParameters'
  try {
    logT(mod, fun, ``)
    const splitUrl = reqUrl.split('?')
    if ((splitUrl.length = 1 || !splitUrl[1])) return // No parameters found
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

// ------------------------------------------------------------------------------------------------
// Functions: http requests
// ------------------------------------------------------------------------------------------------

export const httpGet = async (destUrl, authorizationToken) => {
  const fun = 'httpGet'
  logT(mod, fun, ``)
  try {
    const reqOpts = {
      headers: {
        'User-Agent': 'Rudi-Producer',
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
    logT(mod, fun, ``)

    const reqOpts = {
      headers: {
        'User-Agent': 'Rudi-Producer',
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
  logT(mod, fun, ``)
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
    logT(mod, fun, ``)
    const reqOpts = {
      headers: {
        'User-Agent': 'Rudi-Producer',
        'Content-Type': 'application/json',
      },
    }
    if (authorizationToken) reqOpts.headers.Authorization = `Bearer ${authorizationToken}`

    const answer = await directPost(destUrl, dataToSend, reqOpts)

    logD(mod, fun, `answer: ${beautify(answer.data)}`)
    return answer.data
  } catch (err) {
    throw RudiError.treatCommunicationError(mod, fun, err)
  }
}

export const httpPut = async (destUrl, dataToSend, authorizationToken) => {
  const fun = 'httpPut'
  try {
    logT(mod, fun, ``)
    const reqOpts = {
      headers: {
        'User-Agent': 'Rudi-Producer',
        'Content-Type': 'application/json',
      },
    }
    if (authorizationToken) reqOpts.headers.Authorization = `Bearer ${authorizationToken}`

    const answer = await directPut(destUrl, dataToSend, reqOpts)

    logD(mod, fun, `answer: ${beautify(answer.data)}`)
    return answer.data
  } catch (err) {
    throw RudiError.treatCommunicationError(mod, fun, err)
  }
}

export const directGet = async (destUrl, reqOpts) => {
  const fun = 'directGet'
  try {
    logT(mod, fun, ``)
    logD(mod, fun, `destUrl: ${destUrl}`)
    logD(mod, fun, `reqOpts: ${beautify(reqOpts)}`)
    // if (reqOpts) reqOpts.httpsAgent = sslAgent
    // else reqOpts = { httpsAgent: sslAgent }
    logD(mod, fun, 'right before')
    const answer = await axios.get(destUrl, reqOpts)
    logD(mod, fun, 'right after')
    logHttpAnswer(mod, fun, answer)
    return answer
  } catch (err) {
    throw RudiError.treatCommunicationError(mod, fun, err)
  }
}

export const directPost = async (destUrl, dataToSend, reqOpts) => {
  const fun = 'directPost'
  logT(mod, fun, ``)
  // logD(mod, fun, `${destUrl}`)
  // if (reqOpts) reqOpts.httpsAgent = sslAgent
  // else reqOpts = { httpsAgent: sslAgent }
  try {
    const answer = await axios.post(destUrl, dataToSend, reqOpts)
    logHttpAnswer(mod, fun, answer)
    return answer
  } catch (err) {
    // logW(mod, fun, beautify(err) || err)
    throw RudiError.treatCommunicationError(mod, fun, err)
  }
}

export const directPut = async (destUrl, dataToSend, reqOpts) => {
  const fun = 'directPut'
  logT(mod, fun, ``)
  // logD(mod, fun, `${destUrl}`)
  // if (reqOpts) reqOpts.httpsAgent = sslAgent
  // else reqOpts = { httpsAgent: sslAgent }
  try {
    const answer = await axios.put(destUrl, dataToSend, reqOpts)
    logHttpAnswer(mod, fun, answer)
    return answer
  } catch (err) {
    // logW(mod, fun, beautify(err) || err)
    throw RudiError.treatCommunicationError(mod, fun, err)
  }
}

/* function doHttpRequest(options, protocol, data) {
  const fun = 'doHttpRequest'
  // logT(mod, fun, ``)

  const httpProtocol = protocol === PROTOCOL.HTTP ? http : https
  // options.agent = new httpProtocol.Agent({rejectUnauthorized: false})
  logD(mod, fun, `options: ${beautify(options)}`)

  return new Promise((resolve, reject) => {
    const req = httpProtocol.request(options, (res) => {
      logD(mod, fun, `statusCode: ${res.statusCode}`)
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`statusCode: ${res.statusCode}`))
      }
      // res.setEncoding('utf8')
      let body = []

      res.on('data', (chunk) => {
        // logD(mod, fun, `chunk: ${beautify(chunk)}`)
        body.push(chunk)
      })

      res.on('end', () => {
        try {
          body = JSON.parse(Buffer.concat(body).toString())
        } catch (e) {
          logW(mod, fun, e)
          // reject(e)
        }
        resolve(body)
      })
    })

    req.on('error', (err) => {
      logW(mod, fun, `${err.stack} - ${beautify(err)}`)
      reject(err)
    })

    if (data) req.write(data)

    req.end()
  })
}
 */
