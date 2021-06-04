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

exports.get = async (options, authorizationToken) => {
  const fun = 'getRequest'
  log.d(mod, fun, ``)
  try {
    const destUrl = `${options.protocol}://${options.hostname}/${options.path}`
    const reqOpts = {
      headers: {
        'User-Agent': 'Rudi-Producer',
        'Content-Type': 'application/json',
      },
    }
    if (authorizationToken) {
      reqOpts.headers.Authorization = `Bearer ${authorizationToken}`
    }
    log.d(mod, fun, `reqOpts: ${utils.beautify(reqOpts)}`)

    let res
    try {
      res = await axios.get(destUrl, reqOpts)
    } catch (error) {
      log.w(mod, fun, `GET: ${error}`)
      throw error
    }
    return res.data
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

exports.post = async (dataToSend, options, authorizationToken) => {
  const fun = 'postRequest'
  log.d(mod, fun, ``)
  try {
    const destUrl = `${options.protocol}://${options.hostname}/${options.path}`
    const reqOpts = {
      headers: {
        'User-Agent': 'Rudi-Producer',
        'Content-Type': 'application/json',
      },
    }
    if (authorizationToken) reqOpts.headers.Authorization = `Bearer ${authorizationToken}`

    // log.d(mod, fun, `destUrl: ${destUrl}`)
    // log.d(mod, fun, `reqOpts: ${utils.beautify(reqOpts, 2)}`)
    const answer = await axios.post(destUrl, dataToSend, reqOpts)
    // .catch((err) => {
    //   // const error = {statusCode: 400, message: err.response.data.label}
    //   // log.w(mod, fun, `POST: ${utils.beautify(err.response.data)}`)
    //   throw new Error(err.response.data)
    // })
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
