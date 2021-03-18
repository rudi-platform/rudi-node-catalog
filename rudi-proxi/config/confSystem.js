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
const confFileName = 'rudi_proxi.ini'

// Node Server section
const serverSection = 'server'

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
let DEFAULT_CONF = {}

// Node.js server
DEFAULT_CONF[serverSection] = {}
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
DEFAULT_CONF[logSection][_logFileName] = 'log_file'

const DEFAULT_OUT_LOGFILE = `${DEFAULT_CONF[logSection][_appName]}.log`

 
//———————————————————————————————————————————————————————————————
// Local configuration file extraction
//———————————————————————————————————————————————————————————————

exports.readIniFile = () => {
  const fun = '[readIniFile]'
  try {
    const confFile = fs.readFileSync(`./${confFileName}`, 'utf-8')
    console.log(mod, fun, `Conf file found at ./${confFileName}`)
    const conf = ini.parse(confFile)
    // console.log(mod, fun, `${json.beautify(conf)}`)
    // const logging = conf[logSection]
    // if (null != logging) {
    //   console.log(mod, fun, `APP_NAME: ${logging[_appName]}`)
    //   console.log(mod, fun, `LOG_DIR: ${logging[_logDir]}`)
    //   console.log(mod, fun, `LOG_FILE: ${logging[_logFileName]}`)
    // }

    // const db = conf[dbSection]
    // if (null != db) {
    //   console.log(mod, fun, `DB_NAME: ${db[_dbName]}`)
    //   console.log(mod, fun, `DB_PORT: ${db[_dbPort]}`)
    //   console.log(mod, fun, `DB_URL: ${db[_dbUrl]}`)
    // }

    return conf
  } catch (err) {
    console.error(mod, fun, `${err}`)
  }
}

function quietAccess(obj, prop, alt) {
  try {
    return obj[prop]
  } catch {
    return alt
  }
}

function getValue(localConf, defaultConf, section, field) {
  const localSection = quietAccess(localConf, section, {})
  return quietAccess(localSection, field, defaultConf[section][field])
}

//———————————————————————————————————————————————————————————————
// Exporting sys configuration
//———————————————————————————————————————————————————————————————
var conf = this.readIniFile()

// SERVER
exports.LISTENING_PORT = getValue(conf, DEFAULT_CONF, serverSection, _serverPort)

// DB
exports.DB_NAME = getValue(conf, DEFAULT_CONF, dbSection, _dbName)
exports.DB_PORT = getValue(conf, DEFAULT_CONF, dbSection, _dbPort)
const DB_URL_PREFIX = getValue(conf, DEFAULT_CONF, dbSection, _dbUrl)
exports.DB_URL = `${ DB_URL_PREFIX }${ this.DB_NAME }`

// Logs
exports.APP_NAME = getValue(conf, DEFAULT_CONF, logSection, _appName)
exports.LOG_DIR = getValue(conf, DEFAULT_CONF, logSection, _logDir)
exports.LOG_FILE = getValue(conf, DEFAULT_CONF, logSection, _logFileName)
exports.OUT_LOG = `${this.LOG_DIR}/${this.LOG_FILE}`

const fun = '[export]'

console.log(mod, fun, `APP_NAME: ${this.APP_NAME}`)
console.log(mod, fun, `LISTENING_PORT: ${this.LISTENING_PORT}`)
console.log(mod, fun, `LOG_DIR: ${this.LOG_DIR}`)
console.log(mod, fun, `LOG_FILE: ${this.LOG_FILE}`)
console.log(mod, fun, `DB_NAME: ${this.DB_NAME}`)
console.log(mod, fun, `DB_PORT: ${this.DB_PORT}`)
console.log(mod, fun, `DB_URL: ${this.DB_URL}`)