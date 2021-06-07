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
  const fun = 'directGet'
  log.d(mod, fun, ``)
  try {
    const reqOpts = {
      headers: {
        'User-Agent': 'Rudi-Producer',
        'Content-Type': 'application/json',
      },
    }
    if (authorizationToken) reqOpts.headers.Authorization = `Bearer ${authorizationToken}`

    let answer
    try {
      answer = await axios.get(destUrl, reqOpts)
    } catch (error) {
      log.w(mod, fun, `GET: ${error}`)
      throw error
    }
    log.d(mod, fun, `answer: ${utils.beautify(answer.data)}`)
    return answer.data
  } catch (err) {
    log.w(mod, fun, err)
    throw err
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

    const answer = await axios.post(destUrl, dataToSend, reqOpts)

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
