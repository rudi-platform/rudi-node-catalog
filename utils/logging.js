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
const {
  displayStr,
  logWhere,
  beautify,
  shorten,
  consoleErr,
  getReqIpAndRedirections,
} = require('./jsUtils')

const { logger, sysLogger, getLogLevel } = require('../config/confLogs')
const { addLogEntry } = require('../db/dbQueries')
const { API_METADATA_ID, API_DATA_NAME_PROPERTY } = require('../db/dbFields')
const { TRACE } = require('../config/confApi')

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
function log(logLevel, srcMod, srcFun, msg) {
  try {
    logger[logLevel](displayStr(srcMod, srcFun, msg))
    console.log(displayStr(srcMod, srcFun, msg))
    addLogEntry(logLevel, srcMod, srcFun, msg)
  } catch (e) {
    consoleErr(e)
  }
}
exports.e = (srcMod, srcFun, msg) => log('error', srcMod, srcFun, msg)
exports.w = (srcMod, srcFun, msg) => log('warn', srcMod, srcFun, msg)
exports.i = (srcMod, srcFun, msg) => log('info', srcMod, srcFun, msg)
exports.v = (srcMod, srcFun, msg) => log('verbose', srcMod, srcFun, msg)
exports.d = (srcMod, srcFun, msg) => log('debug', srcMod, srcFun, msg)

exports.t = (srcMod, srcFun, msg) => {
  const logLevel = 'trace'
  if (getLogLevel() != logLevel) return
  try {
    logger.debug(displayStr(srcMod, srcFun, msg))
    addLogEntry(logLevel, srcMod, srcFun, msg)
  } catch (e) {
    consoleErr(e)
  }
}

// ------------------------------------------------------------------------------------------------
// Syslog functions
// ------------------------------------------------------------------------------------------------
exports.displaySyslog = (srcMod, srcFun, msg) => {
  return `[ ${logWhere(srcMod, srcFun)} ] ${msg !== '' ? msg : '<-'}`
}

const treatSyslogInfo = (info) => {
  if (info && info.req) {
    const req = info.req
    info.req_ip = getReqIpAndRedirections(req)
    info.req_mtd = req.method
    info.req_url = req.url

    info.req = undefined
  }
  return info
}

// System-related "panic" conditions
exports.sysEmerg = (msg, info) => sysLogger.emerg(msg, treatSyslogInfo(info))

// Something bad happened, deal with it NOW!
exports.sysAlert = (msg, info) => sysLogger.alert(msg, treatSyslogInfo(info))

// Something bad is about to happen, deal with it NOW!
exports.sysCrit = (msg, info) => sysLogger.crit(msg, treatSyslogInfo(info))

// A failure in the system that needs attention.
exports.sysError = (msg, info) => sysLogger.error(msg, treatSyslogInfo(info))

// Something will happen if it is not dealt within a timeframe.
exports.sysWarn = (msg, info) => sysLogger.warn(msg, treatSyslogInfo(info))

// Events that are unusual but not error conditions - might be summarized in an email to developers
// or admins to spot potential problems - no immediate action required.
exports.sysNotice = (msg, info) => sysLogger.notice(msg, treatSyslogInfo(info))

// Normal operational messages - may be harvested for reporting, measuring throughput, etc.
// No action required.
exports.sysInfo = (msg, info) => sysLogger.info(msg, treatSyslogInfo(info))

// Normal operational messages - may be harvested for reporting, measuring throughput, etc.
// No action required.
exports.sysDebug = (msg, info) => sysLogger.debug(msg, treatSyslogInfo(info))

// ------------------------------------------------------------------------------------------------
// Http
// ------------------------------------------------------------------------------------------------

exports.logHttpAnswer = (loggedMod, loggedFun, httpAnswer) => {
  try {
    const resExtract = pick(httpAnswer.config, ['method', 'headers', 'url'])
    resExtract.url = shorten(resExtract.url, 70)
    resExtract.headers.Authorization = shorten(resExtract.headers.Authorization, 30)
    const redactedRes = `HTTP answer: ${beautify(resExtract)}`
    this.d(loggedMod, loggedFun, redactedRes)
    this.sysInfo(redactedRes)
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
// Errors
// ------------------------------------------------------------------------------------------------

exports.logErrorPile = (error) => {
  // const fun = 'showErrorPile'
  const errContext = error.context
  if (!errContext) return
  errContext.map((error) => {
    this.w(error.mod, error.fun, `${error[TRACE]}`)
  })
}
// exports.logRequest = (req) => {
//   const fun = 'apiCall'
//   this.i('http', fun, `${req.method} ${req.url} <- ${displayIps(req)}`)
// }
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
