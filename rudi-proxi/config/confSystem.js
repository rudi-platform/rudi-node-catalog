'use strict';

const mod = '[sysConf]'

//———————————————————————————————————————————————————————————————
// External dependecies
//———————————————————————————————————————————————————————————————
const fs = require('fs')
const ini = require('ini');

//———————————————————————————————————————————————————————————————
// Default configuration
//———————————————————————————————————————————————————————————————

// DB
const DEFAULT_DB_NAME = 'rudi_prod'
const DEFAULT_DB_PORT = 27017
const DEFAULT_DB_URL = 'mongodb://127.0.0.1/'

// Logs
const DEFAULT_APP_NAME = 'rudiProxi'

const DEFAULT_LOG_DIR = 'logs'
const DEFAULT_LOG_PATH = `./${DEFAULT_LOG_DIR}`
const DEFAULT_OUT_LOGFILE = `${DEFAULT_APP_NAME}.log`


//———————————————————————————————————————————————————————————————
// Local configuration file settings
//———————————————————————————————————————————————————————————————
const confFileName = 'rudi_proxi.ini'

// DB section
const dbSection = 'database'

const _dbUrl = 'db_url'
const _dbName = 'db_name'
const _dbPort = 'db_port'

// Logs section
const logSection = 'logging'

const _appName = 'app_name'

const _logFileName = 'log_file'
const _logDir = 'log_dir'

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

//———————————————————————————————————————————————————————————————
// Exporting sys configuration
//———————————————————————————————————————————————————————————————
var conf = this.readIniFile()

// DB
const dbSec = quietAccess(conf, dbSection, {})
exports.DB_NAME = dbSec[_dbName] || DEFAULT_DB_NAME
exports.DB_PORT = dbSec[_dbPort] || DEFAULT_DB_PORT
exports.DB_URL = `${ dbSec[_dbUrl] || DEFAULT_DB_URL }${this.DB_NAME}`

// Logs
const loggingSec = quietAccess(conf, logSection, {})
exports.APP_NAME = loggingSec[_appName] || DEFAULT_APP_NAME
exports.LOG_DIR = loggingSec[_logDir] || DEFAULT_LOG_DIR
exports.LOG_FILE = loggingSec[_logFileName] || DEFAULT_OUT_LOGFILE
exports.OUT_LOG = `${this.LOG_DIR}/${this.LOG_FILE}`

const fun = '[export]'

console.log(mod, fun, `APP_NAME: ${this.APP_NAME}`)
console.log(mod, fun, `LOG_DIR: ${this.LOG_DIR}`)
console.log(mod, fun, `LOG_FILE: ${this.LOG_FILE}`)
console.log(mod, fun, `DB_NAME: ${this.DB_NAME}`)
console.log(mod, fun, `DB_PORT: ${this.DB_PORT}`)
console.log(mod, fun, `DB_URL: ${this.DB_URL}`)