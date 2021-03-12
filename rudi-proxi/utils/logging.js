'use strict';


//———————————————————————————————————————————————————————————————
// Internal dependencies
//———————————————————————————————————————————————————————————————
const {logger} = require('../config/confLogs')
//———————————————————————————————————————————————————————————————
// Colors
//———————————————————————————————————————————————————————————————
const Colors = {
  Reset: "\x1b[0m",
  Bright: "\x1b[1m",
  Dim: "\x1b[2m",
  Underscore: "\x1b[4m",
  Blink: "\x1b[5m",
  Reverse: "\x1b[7m",
  Hidden: "\x1b[8m",

  FgBlack: "\x1b[30m",
  FgRed: "\x1b[31m",
  FgGreen: "\x1b[32m",
  FgYellow: "\x1b[33m",
  FgBlue: "\x1b[34m",
  FgMagenta: "\x1b[35m",
  FgCyan: "\x1b[36m",
  FgWhite: "\x1b[37m",

  BgBlack: "\x1b[40m",
  BgRed: "\x1b[41m",
  BgGreen: "\x1b[42m",
  BgYellow: "\x1b[43m",
  BgBlue: "\x1b[44m",
  BgMagenta: "\x1b[45m",
  BgCyan: "\x1b[46m",
  BgWhite: "\x1b[47m"
}

const FgErrorDebug = Colors.FgCyan
const FgErrorColor = Colors.FgRed
const BgErrorDebug = ''
const BgErrorColor = Colors.BgWhite
//———————————————————————————————————————————————————————————————
// Constants
//———————————————————————————————————————————————————————————————
const levels = {
  error: 0,
  warning: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
}
const LOG_LVL = levels.debug

//———————————————————————————————————————————————————————————————
// Display functions
//———————————————————————————————————————————————————————————————
function displayColor(fgColor, bgColor, msg) {
  console.log(fgColor, bgColor, msg, Colors.Reset);
}

function display(logLvl, msg) {
  displayColor(
    logLvl == ERROR ? FgErrorColor : FgErrorDebug,
    logLvl == ERROR ? BgErrorColor : BgErrorDebug,
    `[ ${logLvl} ] ${msg}`)
}

function displayLine(logLvl, mod, fun, msg) {
  display(logLvl, `• ${displayStr(mod, fun, msg)}`)
}

function displayStr(mod, fun, msg) {
  if ('' == mod)
  return `[ ${fun} ] ${msg != ''? msg : '<-'}`
  else
    return `[ ${mod} • ${fun} ] ${msg!=''?msg:'<-'}`
}


//———————————————————————————————————————————————————————————————
// Logging functions
//———————————————————————————————————————————————————————————————
const ERROR = 'ERROR'
const WARNING = 'WARNING'
const INFO = 'INFO'
const VERBOSE = 'VERBOSE'
const DEBUG = 'DEBUG'




exports.e = (mod, fun, msg) => {
  logger.error(displayStr(mod, fun, msg))
  // displayFunc(ERROR, fun, msg)
}

exports.w = (mod, fun, msg) => {
  logger.warning(displayStr(mod, fun, msg))

  // if (LOG_LVL < levels.warning) return
  // displayFunc(WARNING, fun, msg)
}

exports.i = (mod, fun, msg) => {
  logger.info(displayStr(mod, fun, msg))
  // if (LOG_LVL < levels.info) return
  // displayFunc(INFO, fun, msg)
}

exports.v = (mod, fun, msg) => {
  logger.verbose(displayStr(mod, fun, msg))
  // if (LOG_LVL < levels.verbose) return
  // displayFunc(VERBOSE, fun, msg)
}

exports.d = (mod, fun, msg) => {
  logger.debug(displayStr(mod, fun, msg))
  // if (LOG_LVL < levels.debug) return
  // displayFunc(DEBUG, fun, msg)
}