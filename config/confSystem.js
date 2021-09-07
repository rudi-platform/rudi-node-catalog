'use strict'

const mod = 'sysConf'
const fun = 'export'
// -----------------------------------------------------------------------------
// External dependecies
// -----------------------------------------------------------------------------
require('winston')
const { format } = require('date-and-time')

// -----------------------------------------------------------------------------
// Internal dependecies
// -----------------------------------------------------------------------------
const fa = require('../utils/fileActions')
const utils = require('../utils/jsUtils')

utils.separateLogs()

// -----------------------------------------------------------------------------
// Constants: local ini file configuration settings
// -----------------------------------------------------------------------------

// Conf files name
// - directory
const iniDir = './0-ini'
// - user conf path
const userConfFile = `${iniDir}/conf_custom.ini`
// - default conf path
const defaultConfFile = `${iniDir}/conf_default.ini`

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
const _logLevel = 'log_level'
const _expires = 'expires'

// Logs section
const SYSLOG_SECTION = 'syslog'

const _syslogHost = 'syslog_host'
const _syslogPort = 'syslog_port'
const _syslogPath = 'syslog_path'
const _syslogLevel = 'syslog_lvl'
const _syslogType = 'syslog_type'

// Security section
const SECURITY_SECTION = 'security'
const _profilesConfFile = 'profiles'
const _should_control_private_requests = 'should_control_private_requests'

// -----------------------------------------------------------------------------
// Constants: user and local configuration
// -----------------------------------------------------------------------------
// Getting user conf file value
// if null, local conf file value
// if null , default value
exports.USER_CONF = fa.readIniFile(userConfFile)
exports.LOCAL_CONF = fa.readIniFile(defaultConfFile)

// -----------------------------------------------------------------------------
// Helper functions
// -----------------------------------------------------------------------------

// Get values from global constants
// -> gets user conf file value
//    if null get local conf file value
//    if null get default value
exports.getIniValue = (section, field) => {
  const userValue = utils.quietAccess(this.USER_CONF[section], field)
  const localValue = utils.quietAccess(this.LOCAL_CONF[section], field)

  if (userValue != utils.NOT_FOUND) return userValue
  if (localValue != utils.NOT_FOUND) return localValue
  return utils.NOT_FOUND
}

// -----------------------------------------------------------------------------
// Extracting and exporting sys configuration
// -----------------------------------------------------------------------------

// Server
exports.LISTENING_ADDR = this.getIniValue(SERVER_SECTION, _serverAddress)
exports.LISTENING_PORT = this.getIniValue(SERVER_SECTION, _serverPort)

// DB
exports.DB_NAME = this.getIniValue(DB_SECTION, _dbName)
const DB_URL_PREFIX = this.getIniValue(DB_SECTION, _dbUrl)
exports.DB_URL = `${DB_URL_PREFIX}${this.DB_NAME}`

// Logs
exports.APP_NAME = this.getIniValue(LOG_SECTION, _appName)
exports.LOG_DIR = this.getIniValue(LOG_SECTION, _logDir)
exports.LOG_FILE = this.getIniValue(LOG_SECTION, _logFileName)
exports.OUT_LOG = `${this.LOG_DIR}/${this.LOG_FILE}`
exports.SYMLINK_NAME = `${this.APP_NAME}-current.log`
exports.LOG_LVL = this.getIniValue(LOG_SECTION, _logLevel)
exports.LOG_EXP = this.getIniValue(LOG_SECTION, _expires)

// Syslog
exports.SYSLOG_HOST = this.getIniValue(SYSLOG_SECTION, _syslogHost)
exports.SYSLOG_PORT = this.getIniValue(SYSLOG_SECTION, _syslogPort)
exports.SYSLOG_PATH = this.getIniValue(SYSLOG_SECTION, _syslogPath)
exports.SYSLOG_LEVEL = this.getIniValue(SYSLOG_SECTION, _syslogLevel)
exports.SYSLOG_TYPE = this.getIniValue(SYSLOG_SECTION, _syslogType)

// Security
const profilesConfFile = this.getIniValue(SECURITY_SECTION, _profilesConfFile)
const PROFILES = fa.readIniFile(profilesConfFile)
exports.SHOULD_CONTROL_PRIVATE_REQUESTS = this.getIniValue(
  SECURITY_SECTION,
  _should_control_private_requests
)

exports.getProfile = (subject) => {
  return PROFILES[subject]
}

// const now = utils.nowLocaleFormatted()

utils.consoleLog(mod, fun, `APP_NAME: ${this.APP_NAME}`)
utils.consoleLog(mod, fun, `LISTENING_ADDR: ${this.LISTENING_ADDR}`)
utils.consoleLog(mod, fun, `LISTENING_PORT: ${this.LISTENING_PORT}`)
utils.consoleLog(mod, fun, `OUT_LOG: ${this.OUT_LOG}`)
utils.consoleLog(mod, fun, `LOG_LVL: ${this.LOG_LVL}`)
utils.consoleLog(mod, fun, `LOG_EXP: ${this.LOG_EXP}`)
utils.consoleLog(mod, fun, `DB_NAME: ${this.DB_NAME}`)
utils.consoleLog(mod, fun, `DB_URL: ${this.DB_URL}`)

exports.getHost = () => {
  return `http://${this.LISTENING_ADDR}:${this.LISTENING_PORT}`
}
