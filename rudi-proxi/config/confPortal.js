'use strict'

// const mod = 'sysPortal'

// -----------------------------------------------------------------------------
// Internal dependecies
// -----------------------------------------------------------------------------
const fa = require('../utils/fileActions')
// const log = require('../utils/logging')
const utils = require('../utils/jsUtils')

// -----------------------------------------------------------------------------
// Constants: local ini file configuration settings
// -----------------------------------------------------------------------------

// Conf file name
const defPortalConfFile = 'rudi_portal_default.ini'
const usrPortalConfFile = 'rudi_portal_custom.ini'

// Auth section
const AUTH_SECTION = 'auth'
const _authUrl = 'portal_auth_url'
const _authGet = 'portal_auth_get'
const _authChk = 'portal_auth_chk'

// Creds section
const CREDS_SECTION = 'creds'
const _login = 'portal_login'
const _passw = 'portal_passw'
const _secret = 'portal_secret'

// API section
const API_SECTION = 'api'
const _getUrl = 'portal_get_url'
const _sendUrl = 'portal_put_url'

// -----------------------------------------------------------------------------
// Extracting portal configuration
// -----------------------------------------------------------------------------
const DEF_PORTAL_CONF = fa.readIniFile(defPortalConfFile)
const USR_PORTAL_CONF = fa.readIniFile(usrPortalConfFile)

// -----------------------------------------------------------------------------
// Helper functions
// -----------------------------------------------------------------------------

// Get values from global constants
// -> gets user conf file value
//    if null get local conf file value
//    if null get default value
function getIniValue(section, field) {
  const userValue = utils.quietAccess(USR_PORTAL_CONF[section], field)
  const localValue = utils.quietAccess(DEF_PORTAL_CONF[section], field)

  return userValue || localValue
}

// -----------------------------------------------------------------------------
// Extracting and exporting sys configuration
// -----------------------------------------------------------------------------

// ----- Auth
const AUTH_URL = getIniValue(AUTH_SECTION, _authUrl)
const AUTH_GET = getIniValue(AUTH_SECTION, _authGet)
const AUTH_CHK = getIniValue(AUTH_SECTION, _authChk)

exports.getAuthUrl = () => {
  return `${AUTH_URL}/${AUTH_GET}`
}

exports.getCheckAuthUrl = () => {
  return `${AUTH_URL}/${AUTH_CHK}`
}

// ----- Creds
exports.LOGIN = getIniValue(CREDS_SECTION, _login)
exports.PASSW = getIniValue(CREDS_SECTION, _passw)
exports.SECRET = getIniValue(CREDS_SECTION, _secret)

// ----- API: Get
exports.API_GET_URL = getIniValue(API_SECTION, _getUrl)

const apiGetUrlElements = this.API_GET_URL.split('/')
exports.API_GET_PROTOCOL = apiGetUrlElements[0].replace(/:/, '')
exports.API_GET_PORT = this.API_GET_PROTOCOL === 'https' ? 443 : 80
exports.API_GET_HOST = apiGetUrlElements[2]
exports.API_GET_PATH = apiGetUrlElements.splice(3).join('/')

exports.apiGetOptions = (id) => {
  return {
    protocol: this.API_GET_PROTOCOL,
    hostname: this.API_GET_HOST,
    port: this.API_GET_PORT,
    path: this.API_GET_PATH.replace(/{{id}}/, id),
  }
}

// ----- API: Send
exports.API_SEND_URL = getIniValue(API_SECTION, _sendUrl)
const apiSendUrlElements = this.API_SEND_URL.split('/')
exports.API_SEND_PROTOCOL = apiSendUrlElements[0].replace(/:/, '')
exports.API_SEND_PORT = this.API_SEND_PROTOCOL === 'https' ? 443 : 80
exports.API_SEND_HOST = apiSendUrlElements[2]
exports.API_SEND_PATH = apiSendUrlElements.splice(3).join('/')

exports.apiSendOptions = () => {
  return {
    protocol: this.API_SEND_PROTOCOL,
    hostname: this.API_SEND_HOST,
    port: this.API_SEND_PORT,
    path: this.API_SEND_PATH,
  }
}

exports.PARAM_TOKEN = 'token'

exports.FIELD_TOKEN = 'access_token'

exports.JWT_TYP = 'typ'
exports.JWT_USER = 'user_name'
exports.JWT_CLIENT = 'user_name'
exports.JWT_EXP = 'exp'
