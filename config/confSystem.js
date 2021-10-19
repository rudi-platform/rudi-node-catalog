'use strict'

const mod = 'sysConf'
// ------------------------------------------------------------------------------------------------
// External dependecies
// ------------------------------------------------------------------------------------------------
// const { format } = require('date-and-time')

// ------------------------------------------------------------------------------------------------
// Internal dependecies
// ------------------------------------------------------------------------------------------------
const fa = require('../utils/fileActions')
const utils = require('../utils/jsUtils')

utils.separateLogs()

// ------------------------------------------------------------------------------------------------
// Constants: local ini file configuration settings
// ------------------------------------------------------------------------------------------------

// Conf files name
// - directory
const iniDir = './0-ini'
// - user conf path
const userConfFile = `${iniDir}/conf_custom.ini`
// - default conf path
const defaultConfFile = `${iniDir}/conf_default.ini`

// ------------------------------------------------------------------------------------------------
// Constants: user and local configuration
// ------------------------------------------------------------------------------------------------
// Getting user conf file value
// if null, local conf file value
// if null , default value
exports.USER_CONF = fa.readIniFile(userConfFile)
exports.LOCAL_CONF = fa.readIniFile(defaultConfFile)

// ------------------------------------------------------------------------------------------------
// Helper functions
// ------------------------------------------------------------------------------------------------

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

// ------------------------------------------------------------------------------------------------
// Extracting and exporting sys configuration
// ------------------------------------------------------------------------------------------------

// Node Server section
const SERVER_SECTION = 'server'

exports.LISTENING_ADDR = this.getIniValue(SERVER_SECTION, 'listening_address')
exports.LISTENING_PORT = this.getIniValue(SERVER_SECTION, 'listening_port')

// DB section
const DB_SECTION = 'database'

exports.DB_NAME = this.getIniValue(DB_SECTION, 'db_name')
const DB_URL_PREFIX = this.getIniValue(DB_SECTION, 'db_url')
exports.DB_URL = `${DB_URL_PREFIX}${this.DB_NAME}`

// Logs section
const LOG_SECTION = 'logging'

exports.APP_NAME = this.getIniValue(LOG_SECTION, 'app_name')
exports.LOG_DIR = this.getIniValue(LOG_SECTION, 'log_dir')
exports.LOG_FILE = this.getIniValue(LOG_SECTION, 'log_file')
exports.OUT_LOG = `${this.LOG_DIR}/${this.LOG_FILE}`
exports.SYMLINK_NAME = `${this.APP_NAME}-current.log`
exports.LOG_LVL = this.getIniValue(LOG_SECTION, 'log_level')
exports.LOG_EXP = this.getIniValue(LOG_SECTION, 'expires')

// Syslog
const SYSLOG_SECTION = 'syslog'

exports.SYSLOG_NODE_NAME = this.getIniValue(SYSLOG_SECTION, 'syslog_node_name')
exports.SYSLOG_PROTOCOL = this.getIniValue(SYSLOG_SECTION, 'syslog_protocol')
exports.SYSLOG_FACILITY = this.getIniValue(SYSLOG_SECTION, 'syslog_facility')
exports.SYSLOG_HOST = this.getIniValue(SYSLOG_SECTION, 'syslog_host')
exports.SYSLOG_PORT = this.getIniValue(SYSLOG_SECTION, 'syslog_port') // default: 514
exports.SYSLOG_TYPE = this.getIniValue(SYSLOG_SECTION, 'syslog_type') // bsd | 5424
exports.SYSLOG_PATH = this.getIniValue(SYSLOG_SECTION, 'syslog_path') // the path for sending syslog diagrams
exports.SYSLOG_FILE = this.getIniValue(SYSLOG_SECTION, 'syslog_file') // redundancy to backup syslog, in case something is wrong with the 'path' solution

// Security section
const SECURITY_SECTION = 'security'

const profilesConfFile = this.getIniValue(SECURITY_SECTION, 'profiles')
const PROFILES = fa.readIniFile(profilesConfFile)
exports.SHOULD_CONTROL_PRIVATE_REQUESTS = this.getIniValue(
  SECURITY_SECTION,
  'should_control_private_requests'
)
exports.SHOULD_CONTROL_PUBLIC_REQUESTS = this.getIniValue(
  SECURITY_SECTION,
  'should_control_public_requests'
)

exports.getProfile = (subject) => {
  return PROFILES[subject]
}

// const now = utils.nowLocaleFormatted()
const fun = 'feedback'

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
