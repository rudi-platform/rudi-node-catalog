/* eslint-disable no-console */
'use strict'

const mod = 'logging'
// ------------------------------------------------------------------------------------------------
// External dependencies
// ------------------------------------------------------------------------------------------------
const { pick } = require('lodash')
// ------------------------------------------------------------------------------------------------
// Internal dependencies
// ------------------------------------------------------------------------------------------------
const { logger } = require('../config/confLogs')
const { displayStr, logWhere, beautify, displayIps, shorten, consoleErr } = require('./jsUtils')
const { addLogEntry } = require('../db/dbQueries')
const { API_METADATA_ID, API_DATA_NAME_PROPERTY } = require('../db/dbFields')

// ------------------------------------------------------------------------------------------------
// Colors
// ------------------------------------------------------------------------------------------------
/*
const Colors = {
  Reset: '\x1b[0m',
  Bright: '\x1b[1m',
  Dim: '\x1b[2m',
  Underscore: '\x1b[4m',
  Blink: '\x1b[5m',
  Reverse: '\x1b[7m',
  Hidden: '\x1b[8m',

  FgBlack: '\x1b[30m',
  FgRed: '\x1b[31m',
  FgGreen: '\x1b[32m',
  FgYellow: '\x1b[33m',
  FgBlue: '\x1b[34m',
  FgMagenta: '\x1b[35m',
  FgCyan: '\x1b[36m',
  FgWhite: '\x1b[37m',

  BgBlack: '\x1b[40m',
  BgRed: '\x1b[41m',
  BgGreen: '\x1b[42m',
  BgYellow: '\x1b[43m',
  BgBlue: '\x1b[44m',
  BgMagenta: '\x1b[45m',
  BgCyan: '\x1b[46m',
  BgWhite: '\x1b[47m'
}
 */
// const FgErrorDebug = Colors.FgCyan
// const FgErrorColor = Colors.FgRed
// const BgErrorDebug = ''
// const BgErrorColor = Colors.BgWhite

// ------------------------------------------------------------------------------------------------
// Display functions
// ------------------------------------------------------------------------------------------------
exports.displaySyslog = (srcMod, srcFun, msg) => {
  return `[ ${logWhere(srcMod, srcFun)} ] ${msg !== '' ? msg : '<-'}`
}

// function displayColor(fgColor, bgColor, msg) {
//   console.log(fgColor, bgColor, msg, Colors.Reset)
// }

// function display(logLvl, msg) {
//   displayColor(
//     logLvl === ERROR ? FgErrorColor : FgErrorDebug,
//     logLvl === ERROR ? BgErrorColor : BgErrorDebug,
//     `[ ${logLvl} ] ${msg}`)
// }

// function displayLine(logLvl, mod, fun, msg) {
//   display(logLvl, `. ${displayStr(mod, fun, msg)}`)
// }

// ------------------------------------------------------------------------------------------------
// Logging functions
// ------------------------------------------------------------------------------------------------

exports.e = (srcMod, srcFun, msg) => {
  const logLevel = 'error'
  try {
    logger.error(displayStr(srcMod, srcFun, msg))
    addLogEntry(logLevel, srcMod, srcFun, msg)
  } catch (e) {
    consoleErr(e)
  }
}

exports.w = (srcMod, srcFun, msg) => {
  const logLevel = 'warn'
  try {
    logger.warn(displayStr(srcMod, srcFun, msg))
    addLogEntry(logLevel, srcMod, srcFun, msg)
  } catch (e) {
    consoleErr(e)
  }
}

exports.i = (srcMod, srcFun, msg) => {
  const logLevel = 'info'
  try {
    logger.info(displayStr(srcMod, srcFun, msg))
    addLogEntry(logLevel, srcMod, srcFun, msg)
  } catch (e) {
    consoleErr(e)
  }
}

exports.v = (srcMod, srcFun, msg) => {
  const logLevel = 'verbose'
  try {
    logger.verbose(displayStr(srcMod, srcFun, msg))
    addLogEntry(logLevel, srcMod, srcFun, msg)
  } catch (e) {
    consoleErr(e)
  }
}

exports.d = (srcMod, srcFun, msg) => {
  try {
    const logLevel = 'debug'
    logger.debug(displayStr(srcMod, srcFun, msg))
    addLogEntry(logLevel, srcMod, srcFun, msg)
  } catch (e) {
    consoleErr(e)
  }
}

// ------------------------------------------------------------------------------------------------
// Http
// ------------------------------------------------------------------------------------------------

exports.logHttpAnswer = (loggedMod, loggedFun, httpAnswer) => {
  try {
    const resExtract = pick(httpAnswer.config, ['method', 'headers', 'url'])
    resExtract.url = shorten(resExtract.url, 70)
    resExtract.headers.Authorization = shorten(resExtract.headers.Authorization, 30)
    this.d(loggedMod, loggedFun, `HTTP answer: ${beautify(resExtract)}`)
  } catch (err) {
    this.w(mod, 'showHttpAnswer', err)
    throw err
  }
}

// ------------------------------------------------------------------------------------------------
// Metadata
// ------------------------------------------------------------------------------------------------
exports.logMetadata = (metadata) => {
  return `${beautify(pick(metadata, [API_METADATA_ID, API_DATA_NAME_PROPERTY]))}`
}

// ------------------------------------------------------------------------------------------------
// Request inspector
// ------------------------------------------------------------------------------------------------

exports.logRequest = (req) => {
  const fun = 'apiCall'
  this.i('http', fun, `${req.method} ${req.url} <- ${displayIps(req)}`)
  // return
  // this.d(mod, fun, `method: ${utils.beautify(req.method)}`)
  // this.d(mod, fun, `url: ${utils.beautify(req.url)}`)
  // this.d(mod, fun, `routerMethod: ${utils.beautify(req.routerMethod)}`)
  // this.d(mod, fun, `routerPath: ${utils.beautify(req.routerPath)}`)
  // this.d(mod, fun, `params: ${utils.beautify(req.params)}`)
  // this.d(mod, fun, `body: ${utils.beautify(req.body)}`)
  // this.d(mod, fun, `query: ${utils.beautify(req.query)}`)
  // this.d(mod, fun, `headers: ${utils.beautify(req.headers)}`)
  // this.d(mod, fun, `id: ${utils.beautify(req.id)}`)
  // this.d(mod, fun, `ip: ${utils.beautify(req.ip)}`)
  // this.d(mod, fun, `ips: ${utils.beautify(req.ips)}`)
  // this.d(mod, fun, `hostname: ${utils.beautify(req.hostname)}`)
  // this.d(mod, fun, `protocol: ${utils.beautify(req.protocol)}`)
  // this.d(mod, fun, `raw: ${utils.beautify(req.req)}`)
  // this.d(mod, fun, `socket: ${util.inspect(req.socket)}`)
}
