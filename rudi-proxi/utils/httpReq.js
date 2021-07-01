'use strict'

const mod = 'http'

// -----------------------------------------------------------------------------
// External dependecies
// -----------------------------------------------------------------------------
const https = require('https')
const http = require('http')
const { get, post } = require('axios')

// -----------------------------------------------------------------------------
// Internal dependecies
// -----------------------------------------------------------------------------
const log = require('./logging')
const utils = require('./jsUtils')

// -----------------------------------------------------------------------------
// Http protocols
// -----------------------------------------------------------------------------
const PROTOCOL = {
  HTTP: 'http',
  HTTPS: 'https',
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
  const fun = 'getResquest'
  log.d(mod, fun, ``)

  const reqOpts = {
    headers: {
      'User-Agent': 'Rudi-Producer',
      'Content-Type': 'application/json',
    },
  }
  if (authorizationToken) reqOpts.headers.Authorization = `Bearer ${authorizationToken}`

  try {
    const answer = await get(destUrl, reqOpts)
    log.d(mod, fun, `answer: ${utils.beautify(answer.data)}`)
    return answer.data
  } catch (error) {
    log.w(mod, fun, `GET: ${error}`)
    throw error
  }
}

exports.getWithOpts = async (options, authorizationToken) => {
  const fun = 'getRequest'
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
  const fun = 'postRequest'
  log.d(mod, fun, ``)
  try {
    const reqOpts = {
      headers: {
        'User-Agent': 'Rudi-Producer',
        'Content-Type': 'application/json',
      },
    }
    if (authorizationToken) reqOpts.headers.Authorization = `Bearer ${authorizationToken}`
    // log.d(mod, fun, `reqOpts: ${utils.beautify(reqOpts)}`)
    // log.d(mod, fun, `authorizationToken: ${utils.beautify(authorizationToken)}`)
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

exports.directPost = async (destUrl, dataToSend, reqOpts) => {
  const fun = 'directPost'
  log.d(mod, fun, ``)
  try {
    const answer = await post(destUrl, dataToSend, reqOpts)
    return answer
  } catch (err) {
    // log.w(mod, fun, err)
    if (err.response && err.response.data) {
      log.w(mod, fun, utils.beautify(err.response.data))
      if (err.response.data.code && err.response.data.label) {
        const postErr = new Error(`${err.response.data.code}: ${err.response.data.label}`)
        postErr.status = err.status
        throw new Error(`${err.response.data.code}: ${err.response.data.label}`)
      } else {
        throw new Error(`${err.response.data}`)
      }
    } else {
      throw err
    }
  }
}

exports.directGet = async (destUrl, reqOpts) => {
  const fun = 'directGet'
  log.d(mod, fun, ``)
  try {
    const answer = await get(destUrl, reqOpts)
    return answer
  } catch (err) {
    // log.w(mod, fun, err)
    log.w(mod, fun, utils.beautify(err.response.data))
    throw new Error(`${err.response.data.code}: ${err.response.data.label}`)
  }
}
