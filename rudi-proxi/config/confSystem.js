'use strict';

const mod = '[sysConf]'

//———————————————————————————————————————————————————————————————
// External dependecies
//———————————————————————————————————————————————————————————————
const fs = require('fs')
const ini = require('ini');

//———————————————————————————————————————————————————————————————
// Local ini file configuration settings
//———————————————————————————————————————————————————————————————
const userConfFile = 'rudi_proxi_custom.ini'
const defConfFile = 'rudi_proxi_default.ini'

// Node Server section
const serverSection = 'server'

const _serverAddress = 'listening_address'
const _serverPort = 'listening_port'

// DB section
const dbSection = 'database'

const _dbUrl = 'db_url'
const _dbName = 'db_name'
const _dbPort = 'db_port'

// Logs section
const logSection = 'logging'

const _appName = 'app_name' 
const _logDir = 'log_dir'
const _logFileName = 'log_file'


//———————————————————————————————————————————————————————————————
// Default configuration
//———————————————————————————————————————————————————————————————
var DEFAULT_CONF = {}

// Node.js server
DEFAULT_CONF[serverSection] = {}
DEFAULT_CONF[serverSection][_serverAddress] = '0.0.0.0'
DEFAULT_CONF[serverSection][_serverPort] = 3000

// DB
DEFAULT_CONF[dbSection] = {}
DEFAULT_CONF[dbSection][_dbUrl] = 'mongodb://127.0.0.1/'
DEFAULT_CONF[dbSection][_dbName] = 'rudi_prod'
DEFAULT_CONF[dbSection][_dbPort] = 27017
// Logs
DEFAULT_CONF[logSection] = {}
DEFAULT_CONF[logSection][_appName] = 'rudiProxi'

DEFAULT_CONF[logSection][_logDir] = 'logs'
DEFAULT_CONF[logSection][_logFileName] = 'rudiProxi.log'


//———————————————————————————————————————————————————————————————
// Local configuration file extraction
//———————————————————————————————————————————————————————————————

exports.readIniFile = (confFile) => {
  const fun = '[readIniFile]'
  try {
    const confFile = fs.readFileSync(`./${confFile}`, 'utf-8')
    console.log(mod, fun, `Conf file found at ./${confFile}`)
    const conf = ini.parse(confFile)
    return conf
  } catch (err) {
    console.error(mod, fun, `${err}`)
  }
}

function quietAccess(obj, prop, alt) {
  try {
    return obj[prop]
  } catch {
    return {}
  }
}

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
const LOCAL_CONF = this.readIniFile(defConfFile)
const USER_CONF = this.readIniFile(userConfFile)

// SERVER
exports.LISTENING_ADDR = getValue(serverSection, _serverAddress)
exports.LISTENING_PORT = getValue(serverSection, _serverPort)

// DB
exports.DB_NAME = getValue(dbSection, _dbName)
const DB_URL_PREFIX = getValue(dbSection, _dbUrl)
exports.DB_URL = `${ DB_URL_PREFIX }${ this.DB_NAME }`

// Logs
exports.APP_NAME = getValue(logSection, _appName)
exports.LOG_DIR = getValue(logSection, _logDir)
exports.LOG_FILE = getValue(logSection, _logFileName)
exports.OUT_LOG = `${this.LOG_DIR}/${this.LOG_FILE}`

const fun = '[export]'

console.log(mod, fun, `APP_NAME: ${this.APP_NAME}`)
console.log(mod, fun, `LISTENING_PORT: ${this.LISTENING_PORT}`)
console.log(mod, fun, `OUT_LOG: ${this.OUT_LOG}`)
console.log(mod, fun, `DB_NAME: ${this.DB_NAME}`)
console.log(mod, fun, `DB_URL: ${this.DB_URL}`)