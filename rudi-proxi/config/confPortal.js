'use strict'

// const mod = 'sysPortal'

// -----------------------------------------------------------------------------
// Internal dependecies
// -----------------------------------------------------------------------------
const fa = require('../utils/fileActions')
const utils = require('../utils/jsUtils')
const { CONF_USER, CONF_DEFAULT } = require('./confSystem')

// -----------------------------------------------------------------------------
// Constants: local ini file configuration settings
// -----------------------------------------------------------------------------

// Conf file name
// - user conf
const usrPortalConfFile = CONF_USER
// - default conf
const defPortalConfFile = CONF_DEFAULT

const PORTAL_SECTION = 'portal'
// Auth section
const _authUrl = 'auth_url'
const _authGet = 'auth_get'
const _authChk = 'auth_chk'

// Creds section
const _login = 'login'
const _passw = 'passw'
const _secret = 'secret'
const _publicKey = 'publicKey'
const _publicKeyUrl = 'publicKeyUrl'

// API section
const _getUrl = 'get_url'
const _sendUrl = 'put_url'

// Incoming requests control
const _should_control_public_requests = 'should_control_public_requests'

// -----------------------------------------------------------------------------
// Constants: Portal JWT
// -----------------------------------------------------------------------------
exports.PARAM_TOKEN = 'token'

exports.FIELD_TOKEN = 'access_token'

exports.JWT_TYP = 'typ'
exports.JWT_USER = 'user_name'
exports.JWT_CLIENT = 'user_name'
exports.JWT_EXP = 'exp'

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

  if (userValue != utils.NOT_FOUND) return userValue
  if (localValue != utils.NOT_FOUND) return localValue
  return utils.NOT_FOUND
}

// -----------------------------------------------------------------------------
// Extracting and exporting sys configuration
// -----------------------------------------------------------------------------

// ----- Auth
const AUTH_URL = getIniValue(PORTAL_SECTION, _authUrl)
const AUTH_GET = getIniValue(PORTAL_SECTION, _authGet)
const AUTH_CHK = getIniValue(PORTAL_SECTION, _authChk)

exports.getAuthUrl = () => {
  return `${AUTH_URL}/${AUTH_GET}`
}

exports.getCheckAuthUrl = () => {
  return `${AUTH_URL}/${AUTH_CHK}`
}

// ----- Creds
exports.LOGIN = getIniValue(PORTAL_SECTION, _login)
exports.PASSW = getIniValue(PORTAL_SECTION, _passw)
exports.SECRET = getIniValue(PORTAL_SECTION, _secret)
exports.PUBLIC_KEY = getIniValue(PORTAL_SECTION, _publicKey)
exports.PUBLIC_KEY_URL = getIniValue(PORTAL_SECTION, _publicKeyUrl)

exports.SHOULD_CONTROL_PUBLIC_REQUESTS = getIniValue(
  PORTAL_SECTION,
  _should_control_public_requests
)

// ----- API
exports.API_GET_URL = getIniValue(PORTAL_SECTION, _getUrl)
exports.API_SEND_URL = getIniValue(PORTAL_SECTION, _sendUrl)

// ----- API: Get
exports.getPortalMetaUrl = (id) => {
  return `${this.API_GET_URL.replace(/{{id}}/, id)}`
}

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

exports.postPortalMetaUrl = () => {
  return `${this.API_SEND_URL}`
}
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
