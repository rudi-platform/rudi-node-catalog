'use strict';

const mod = '[sysConf]'

//———————————————————————————————————————————————————————————————
// Internal dependecies
//———————————————————————————————————————————————————————————————
const fa = require('../utils/fileActions')


//———————————————————————————————————————————————————————————————
// Constants: local ini file configuration settings
//———————————————————————————————————————————————————————————————

// Conf files name
// - user conf
const userConfFile = 'rudi_proxi_custom.ini'
// - default conf
const defConfFile = 'rudi_proxi_default.ini'

// Node Server section
const SERVER_SECTION = 'server'
const _serverAddress = 'listening_address'
const _serverPort = 'listening_port'

// DB section
const DB_SECTION = 'database'

const _dbUrl = 'db_url'
const _dbName = 'db_name'
const _dbPort = 'db_port'

// Logs section 
const LOG_SECTION = 'logging'

const _appName = 'app_name'
const _logDir = 'log_dir'
const _logFileName = 'log_file'

//———————————————————————————————————————————————————————————————
// Constants: default configuration
//———————————————————————————————————————————————————————————————
var DEFAULT_CONF = {}
// Node.js server
DEFAULT_CONF[SERVER_SECTION] = {}
DEFAULT_CONF[SERVER_SECTION][_serverAddress] = '0.0.0.0'
DEFAULT_CONF[SERVER_SECTION][_serverPort] = 3000
// DB
DEFAULT_CONF[DB_SECTION] = {}
DEFAULT_CONF[DB_SECTION][_dbUrl] = 'mongodb://127.0.0.1/'
DEFAULT_CONF[DB_SECTION][_dbName] = 'rudi_prod'
DEFAULT_CONF[DB_SECTION][_dbPort] = 27017
// Logs
DEFAULT_CONF[LOG_SECTION] = {}
DEFAULT_CONF[LOG_SECTION][_appName] = 'rudiProxi'
DEFAULT_CONF[LOG_SECTION][_logDir] = 'logs'
DEFAULT_CONF[LOG_SECTION][_logFileName] = 'rudiProxi.log'


//———————————————————————————————————————————————————————————————
// Constants: user and local configuration
//———————————————————————————————————————————————————————————————
// Getting user conf file value
// if null, local conf file value
// if null , default value
const USER_CONF = fa.readIniFile(userConfFile)
const LOCAL_CONF = fa.readIniFile(defConfFile)


//———————————————————————————————————————————————————————————————
// Helper functions
//———————————————————————————————————————————————————————————————
// Accessing properties without raising errors
function quietAccess(obj, prop, alt) {
  try {
    return obj[prop]
  } catch {
    return {}
  }
}

// Get values from global constants
// -> gets user conf file value
//    if null get local conf file value
//    if null get default value
function getValue(section, field) {
  const fun = '[getVal]'
  const userSection = quietAccess(USER_CONF, section)
  const userValue = quietAccess(userSection, field)

  const localSection = quietAccess(LOCAL_CONF, section)
  const localValue = quietAccess(localSection, field)

  // console.log(mod, fun, confValue)
  return userValue || localValue || DEFAULT_CONF[section][field]
}

//———————————————————————————————————————————————————————————————
// Extracting and exporting sys configuration
//———————————————————————————————————————————————————————————————

// Server
exports.LISTENING_ADDR = getValue(SERVER_SECTION, _serverAddress)
exports.LISTENING_PORT = getValue(SERVER_SECTION, _serverPort)
 
// DB 
exports.DB_NAME = getValue(DB_SECTION, _dbName)
const DB_URL_PREFIX = getValue(DB_SECTION, _dbUrl)
exports.DB_URL = `${ DB_URL_PREFIX }${ this.DB_NAME }`

// Logs
exports.APP_NAME = getValue(LOG_SECTION, _appName)
exports.LOG_DIR = getValue(LOG_SECTION, _logDir)
exports.LOG_FILE = getValue(LOG_SECTION, _logFileName)
exports.OUT_LOG = `${this.LOG_DIR}/${this.LOG_FILE}`

const fun = '[export]'

console.log(mod, fun, `APP_NAME: ${this.APP_NAME}`)
console.log(mod, fun, `LISTENING_PORT: ${this.LISTENING_PORT}`)
console.log(mod, fun, `OUT_LOG: ${this.OUT_LOG}`)
console.log(mod, fun, `DB_NAME: ${this.DB_NAME}`)
console.log(mod, fun, `DB_URL: ${this.DB_URL}`)