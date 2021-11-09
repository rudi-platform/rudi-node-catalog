'use strict'

const mod = 'http'

// ------------------------------------------------------------------------------------------------
// External dependecies
// ------------------------------------------------------------------------------------------------
// const https = require('https')
// const http = require('http')
const axios = require('axios')

// ------------------------------------------------------------------------------------------------
// Internal dependecies
// ------------------------------------------------------------------------------------------------
const log = require('./logging')
const utils = require('./jsUtils')
const { createRudiHttpError, treatError } = require('./errors')

// ------------------------------------------------------------------------------------------------
// Functions: header treatments
// ------------------------------------------------------------------------------------------------
exports.getHeaderRedirectUrls = (req) => {
  if (!req.headers) return
  return req.headers['x-forwarded-for'] || req.headers['X-Forwarded-For']
}

// ------------------------------------------------------------------------------------------------
// Functions: http requests
// ------------------------------------------------------------------------------------------------
function treatCommunicationError(portalError) {
  const fun = 'treatPortalError'
  let error
  try {
    if (portalError.response && portalError.response.data)
      log.w(mod, fun, `details: ${utils.beautify(portalError.response.data)}`)
    else if (portalError.response)
      log.w(mod, fun, `details: ${utils.beautify(portalError.response)}`)

    if (
      portalError.response &&
      portalError.response.data &&
      portalError.response.data.label &&
      portalError.response.data.code
    ) {
      error = createRudiHttpError(portalError.response.data.code, portalError.response.data.label)
    } else if (portalError.response && portalError.response.data)
      error = new Error(portalError.response.data)
    else {
      if (portalError.response) error = new Error(portalError.response)
      else error = portalError
    }
    return error
  } catch (err) {
    throw treatError(err, { mod: mod, fun: fun })
  }
}
exports.httpGet = async (destUrl, authorizationToken) => {
  const fun = 'httpGet'
  log.t(mod, fun, ``)
  try {
    const reqOpts = {
      headers: {
        'User-Agent': 'Rudi-Producer',
        'Content-Type': 'application/json',
      },
    }
    if (authorizationToken) reqOpts.headers.Authorization = `Bearer ${authorizationToken}`

    const answer = await this.directGet(destUrl, reqOpts)
    log.d(mod, fun, `answer: ${utils.beautify(answer.data)}`)
    return answer.data
  } catch (err) {
    throw treatCommunicationError(err, { mod: mod, fun: fun })
  }
}

exports.httpDelete = async (destUrl, authorizationToken) => {
  const fun = 'httpDelete'
  try {
    log.t(mod, fun, ``)

    const reqOpts = {
      headers: {
        'User-Agent': 'Rudi-Producer',
        'Content-Type': 'application/json',
      },
    }
    if (authorizationToken) reqOpts.headers.Authorization = `Bearer ${authorizationToken}`

    const answer = await axios.delete(destUrl, reqOpts)
    log.d(mod, fun, `answer: ${utils.beautify(answer.data)}`)
    return answer.data
  } catch (err) {
    throw treatCommunicationError(err, { mod: mod, fun: fun })
  }
}

exports.getWithOpts = async (options, authorizationToken) => {
  const fun = 'getWithOpts'
  log.t(mod, fun, ``)
  try {
    const destUrl = `${options.protocol}://${options.hostname}/${options.path}`
    const answer = await this.httpGet(destUrl, authorizationToken)
    return answer.data
  } catch (err) {
    throw treatError(err, { mod: mod, fun: fun })
  }
  // log.d(mod, fun, `destUrl: ${destUrl}`)
  // log.d(mod, fun, `options: ${utils.beautify(options)}`)
  /*
    const reqOpts = {
      hostname: options.hostname,
      port: options.port,
      path: `/${options.path}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Rudi-Producer',
        'Content-Type': 'application/json'
      }
    }
    if (authorizationToken) reqOpts.headers.Authorization = `Bearer ${authorizationToken}`

    log.d(mod, fun, `options: ${utils.beautify(reqOpts)}`)

    return await doHttpRequest(reqOpts, options.protocol)
     */
}

exports.httpPost = async (destUrl, dataToSend, authorizationToken) => {
  const fun = 'httpPost'
  log.t(mod, fun, ``)
  try {
    const reqOpts = {
      headers: {
        'User-Agent': 'Rudi-Producer',
        'Content-Type': 'application/json',
      },
    }
    if (authorizationToken) reqOpts.headers.Authorization = `Bearer ${authorizationToken}`

    const answer = await this.directPost(destUrl, dataToSend, reqOpts)

    log.d(mod, fun, `answer: ${utils.beautify(answer.data)}`)
    return answer.data
  } catch (err) {
    throw treatCommunicationError(err, { mod: mod, fun: fun })
  }
  /*
  const options = {
    hostname: sendOptions.hostname,
    port: sendOptions.port,
    path: sendOptions.path,
    method: 'POST',
    headers: {
      'User-Agent': 'Rudi-Producer',
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  }
  if (authorizationToken) options.headers.Authorization = `Bearer ${authorizationToken}`

  return await doHttpRequest(options, sendOptions.protocol, data)
    */
}

// const sslAgent = new https.Agent({
//   rejectUnauthorized: false,
// })

exports.directPost = async (destUrl, dataToSend, reqOpts) => {
  const fun = 'directPost'
  log.t(mod, fun, ``)
  // log.d(mod, fun, `${destUrl}`)
  // if (reqOpts) reqOpts.httpsAgent = sslAgent
  // else reqOpts = { httpsAgent: sslAgent }
  try {
    const answer = await axios.post(destUrl, dataToSend, reqOpts)
    log.logHttpAnswer(mod, fun, answer)
    return answer
  } catch (err) {
    // log.w(mod, fun, err)
    throw treatCommunicationError(err, { mod: mod, fun: fun })
  }
}

exports.directGet = async (destUrl, reqOpts) => {
  const fun = 'directGet'
  log.t(mod, fun, ``)
  // log.d(mod, fun, `destUrl: ${destUrl}`)
  // if (reqOpts) reqOpts.httpsAgent = sslAgent
  // else reqOpts = { httpsAgent: sslAgent }
  try {
    const answer = await axios.get(destUrl, reqOpts)
    log.logHttpAnswer(mod, fun, answer)
    return answer
  } catch (err) {
    throw treatCommunicationError(err, { mod: mod, fun: fun })
  }
}

/* function doHttpRequest(options, protocol, data) {
  const fun = 'doHttpRequest'
  // log.t(mod, fun, ``)

  const httpProtocol = protocol === PROTOCOL.HTTP ? http : https
  // options.agent = new httpProtocol.Agent({rejectUnauthorized: false})
  log.d(mod, fun, `options: ${utils.beautify(options)}`)

  return new Promise((resolve, reject) => {
    const req = httpProtocol.request(options, (res) => {
      log.d(mod, fun, `statusCode: ${res.statusCode}`)
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`statusCode: ${res.statusCode}`))
      }
      // res.setEncoding('utf8')
      let body = []

      res.on('data', (chunk) => {
        // log.d(mod, fun, `chunk: ${utils.beautify(chunk)}`)
        body.push(chunk)
      })

      res.on('end', () => {
        try {
          body = JSON.parse(Buffer.concat(body).toString())
        } catch (e) {
          log.w(mod, fun, e)
          // reject(e)
        }
        resolve(body)
      })
    })

    req.on('error', (err) => {
      log.w(mod, fun, `${err.stack} - ${utils.beautify(err)}`)
      reject(err)
    })

    if (data) req.write(data)

    req.end()
  })
}
 */
