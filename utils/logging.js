/* eslint-disable no-console */
'use strict'

const mod = 'logging'
// -----------------------------------------------------------------------------
// Internal dependencies
// -----------------------------------------------------------------------------
const { logger, sysLogger } = require('../config/confLogs')
const { consoleErr, displayStr, logWhere, beautify, displayRedirections } = require('./jsUtils')
const { addLogEntry } = require('../db/dbQueries')

// -----------------------------------------------------------------------------
// Colors
// -----------------------------------------------------------------------------
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

// -----------------------------------------------------------------------------
// Display functions
// -----------------------------------------------------------------------------
exports.displaySyslog = (loc_mod, loc_fun, msg) => {
  return `[ ${logWhere(loc_mod, loc_fun)} ] ${msg !== '' ? msg : '<-'}`
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

// -----------------------------------------------------------------------------
// Logging functions
// -----------------------------------------------------------------------------

exports.e = (mod, fun, msg) => {
  const logLevel = 'error'
  logger.error(displayStr(mod, fun, msg))
  sysLogger.error(displayStr(mod, fun, msg))
  addLogEntry(logLevel, mod, fun, msg)
}

exports.w = (mod, fun, msg) => {
  const logLevel = 'warn'
  logger.warn(displayStr(mod, fun, msg))
  addLogEntry(logLevel, mod, fun, msg)
}

exports.i = (mod, fun, msg) => {
  const logLevel = 'info'
  logger.info(displayStr(mod, fun, msg))
  addLogEntry(logLevel, mod, fun, msg)
}

exports.v = (mod, fun, msg) => {
  logger.verbose(displayStr(mod, fun, msg))
  const logLevel = 'verbose'
  addLogEntry(logLevel, mod, fun, msg)
}

exports.d = (mod, fun, msg) => {
  logger.debug(displayStr(mod, fun, msg))
  const logLevel = 'debug'
  addLogEntry(logLevel, mod, fun, msg)
}

// -----------------------------------------------------------------------------
// Request inspector
// -----------------------------------------------------------------------------

exports.logRequest = (req, res) => {
  const fun = 'apiCall'
  this.i('http', fun, `${req.method} ${req.url} <- ${req.ip} ` + displayRedirections(req.headers))
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
