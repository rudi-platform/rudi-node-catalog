'use strict'

const mod = 'http'

// -----------------------------------------------------------------------------
// External dependecies
// -----------------------------------------------------------------------------
const https = require('https')
const http = require('http')
const axios = require('axios')

// -----------------------------------------------------------------------------
// Internal dependecies
// -----------------------------------------------------------------------------
const log = require('./logging')
const utils = require('./jsUtils')
const { InternalServerError, createRudiHttpError } = require('./errors')

// -----------------------------------------------------------------------------
// Http protocols
// -----------------------------------------------------------------------------
const PROTOCOL = {
  HTTP: 'http',
  HTTPS: 'https',
}

// -----------------------------------------------------------------------------
// Functions: header treatments
// -----------------------------------------------------------------------------
exports.getHeaderRedirectUrls = (req) => {
  if (!req.headers) return
  return req.headers['x-forwarded-for'] || req.headers['X-Forwarded-For']
}

// -----------------------------------------------------------------------------
// Functions: http requests
// -----------------------------------------------------------------------------
function doHttpRequest(options, protocol, data) {
  const fun = 'doHttpRequest'
  // log.d(mod, fun, ``)

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

exports.httpGet = async (destUrl, authorizationToken) => {
  const fun = 'httpGet'
  log.d(mod, fun, ``)
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
  } catch (error) {
    log.w(mod, fun, `GET: ${error}`)
    throw error
  }
}

exports.httpDelete = async (destUrl, authorizationToken) => {
  const fun = 'httpDelete'
  log.d(mod, fun, ``)

  const reqOpts = {
    headers: {
      'User-Agent': 'Rudi-Producer',
      'Content-Type': 'application/json',
    },
  }
  if (authorizationToken) reqOpts.headers.Authorization = `Bearer ${authorizationToken}`

  try {
    const answer = await axios.delete(destUrl, reqOpts)
    log.d(mod, fun, `answer: ${utils.beautify(answer.data)}`)
    return answer.data
  } catch (error) {
    log.w(mod, fun, `DELETE: ${error}`)
    log.w(mod, fun, `details: ${utils.beautify(error.response.data)}`)
    if (
      error.response &&
      error.response.data &&
      error.response.data.label &&
      error.response.data.code
    )
      throw createRudiHttpError(error.response.data.code, error.response.data.label)
    else throw error
  }
}

exports.getWithOpts = async (options, authorizationToken) => {
  const fun = 'getWithOpts'
  log.d(mod, fun, ``)
  try {
    const destUrl = `${options.protocol}://${options.hostname}/${options.path}`
    const answer = await this.httpGet(destUrl, authorizationToken)
    return answer.data
  } catch (err) {
    log.w(mod, fun, err)
    throw err
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
  log.d(mod, fun, ``)
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
    log.w(mod, fun, err)
    throw err
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

const sslAgent = new https.Agent({
  rejectUnauthorized: false,
})

exports.directPost = async (destUrl, dataToSend, reqOpts) => {
  const fun = 'directPost'
  log.d(mod, fun, ``)
  // log.d(mod, fun, `${destUrl}`)
  if (reqOpts) reqOpts.httpsAgent = sslAgent
  else reqOpts = { httpsAgent: sslAgent }
  try {
    const answer = await axios.post(destUrl, dataToSend, reqOpts)
    return answer
  } catch (err) {
    // log.w(mod, fun, err)
    if (err.response && err.response.data) {
      log.w(mod, fun, utils.beautify(err.response.data))
      if (err.response.data.code && err.response.data.label) {
        const postErr = new InternalServerError(
          `${err.response.data.code}: ${err.response.data.label}`
        )
        postErr.status = err.status
        throw new InternalServerError(`${err.response.data.code}: ${err.response.data.label}`)
      } else {
        throw new InternalServerError(`${utils.beautify(err.response.data)}`)
      }
    } else {
      log.w(mod, fun, utils.beautify(err))
      throw new InternalServerError(utils.beautify(err))
    }
  }
}

exports.directGet = async (destUrl, reqOpts) => {
  const fun = 'directGet'
  log.d(mod, fun, ``)
  // log.d(mod, fun, `destUrl: ${destUrl}`)
  if (reqOpts) reqOpts.httpsAgent = sslAgent
  else reqOpts = { httpsAgent: sslAgent }
  try {
    const answer = await axios.get(destUrl, reqOpts)
    return answer
  } catch (err) {
    if (err.response && err.response.data)
      throw new Error(`${err.response.data.code}: ${err.response.data.label}`)
    if (err.message && err.code) throw new Error(`${err.code}: ${err.message}`)

    log.w(mod, fun, `err: ${utils.beautify(err)}`)
    if (err.response) log.w(mod, fun, `err.response: ${utils.beautify(err.response)}`)
    log.w(mod, fun, `err.message: ${utils.beautify(err.message)}`)
  }
}
