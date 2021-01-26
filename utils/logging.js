
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
const DEBUG = 'DEBUG'
const INFO = 'INFO'
const WARNING = 'WARNING'
const ERROR = 'ERROR'

const LogLevels = {
  DEBUG: DEBUG, 
  INFO: INFO, 
  WARNING: WARNING,
  ERROR: ERROR
}

const LOG_LVL = LogLevels.DEBUG

//———————————————————————————————————————————————————————————————
// Display functions
//———————————————————————————————————————————————————————————————
function displayColor(fgColor, bgColor, msg){
  console.log(fgColor, bgColor, msg, Colors.Reset);
}

function display(logLvl, msg) {    
  displayColor(
    logLvl == ERROR ? FgErrorColor : FgErrorDebug,
    logLvl == ERROR ? BgErrorColor : BgErrorDebug,
     `[ ${logLvl} ] ${msg}`)
}

function displayFunc(logLvl, func, msg) {
  display(logLvl, `• [ ${func} ] ${msg != ''?msg:'<-'}`)
}

//———————————————————————————————————————————————————————————————
// DEBUG
//———————————————————————————————————————————————————————————————

function d(msg){
  if (LOG_LVL == LogLevels.DEBUG){
    display(DEBUG, msg)
  }
}
function d(func, msg){
  if (LOG_LVL == LogLevels.DEBUG){
    displayFunc(DEBUG, func, msg)
  }
}

//———————————————————————————————————————————————————————————————
// INFO
//———————————————————————————————————————————————————————————————

function i(msg){
  if (LOG_LVL == LogLevels.DEBUG || LOG_LVL == LogLevels.INFO){
    display(INFO, msg)
  }
}
function i(func, msg){
  if (LOG_LVL == LogLevels.DEBUG || LOG_LVL == LogLevels.INFO){
    displayFunc(INFO, func, msg)
  }
}

//———————————————————————————————————————————————————————————————
// WARN
//———————————————————————————————————————————————————————————————

function w(msg){
  if (LOG_LVL != LogLevels.ERROR){
    display(WARNING, msg)
  }
}
function w(func, msg){
  if (LOG_LVL != LogLevels.ERROR){
    displayFunc(WARNING, func, msg)
  }
}

//———————————————————————————————————————————————————————————————
// ERROR
//———————————————————————————————————————————————————————————————

function e(msg){
  display(ERROR, msg)
}
function e(func, msg){
  displayFunc(ERROR, func, msg)
}

module.exports = {
  d,
  i,
  w,
  e
}