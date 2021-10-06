'use strict'

const mod = 'sysPortal'

// -----------------------------------------------------------------------------
// Internal dependecies
// -----------------------------------------------------------------------------
const fa = require('../utils/fileActions')
const utils = require('../utils/jsUtils')
const {
  USER_CONF_FILE,
  DEFAULT_CONF_FILE,
  USER_CONF,
  LOCAL_CONF,
  getIniValue,
} = require('./confSystem')

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
// Helper functions
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// Extracting and exporting sys configuration
// -----------------------------------------------------------------------------
const PORTAL_SECTION = 'portal'

// ----- Auth
const AUTH_URL = getIniValue(PORTAL_SECTION, 'auth_url')
const AUTH_GET = getIniValue(PORTAL_SECTION, 'auth_get')
const AUTH_CHK = getIniValue(PORTAL_SECTION, 'auth_chk')
const PUB_KEY_URL = getIniValue(PORTAL_SECTION, 'auth_pub')

const PUB_KEY_FILE = getIniValue(PORTAL_SECTION, 'path_portal_pub')

exports.getAuthUrl = () => {
  return `${AUTH_URL}/${AUTH_GET}`
}

exports.getCheckAuthUrl = () => {
  return `${AUTH_URL}/${AUTH_CHK}`
}

exports.getAuthPub = () => {
  return `${AUTH_URL}/${PUB_KEY_URL}`
}

exports.getPubKeyFile = () => {
  return PUB_KEY_FILE
}

// ----- Creds
const isPwdClear = getIniValue(PORTAL_SECTION, 'is_pwd_clear')
const LOGIN = getIniValue(PORTAL_SECTION, 'login')
const READ_PASSW = getIniValue(PORTAL_SECTION, 'passw')
const fun = 'readPortalConf'
utils.consoleLog(mod, fun,`READ_PASSW: ${READ_PASSW}` )
const PASSW_B64 = isPwdClear ? utils.toBase64(READ_PASSW) : READ_PASSW
utils.consoleLog(mod, fun,`PASSW_B64: ${PASSW_B64}` )
const SHOULD_CONTROL_EXT_REQUESTS = getIniValue(PORTAL_SECTION, 'should_control_public_requests')

exports.getCredentials = () => {
  return [LOGIN, PASSW_B64]
}

// const SECRET = getIniValue(PORTAL_SECTION, _secret)
exports.getSecret = () => {
  return null
}

exports.shouldControlExtRequest = () => {
  return SHOULD_CONTROL_EXT_REQUESTS
}

// ----- API
const API_PORTAL_URL = getIniValue(PORTAL_SECTION, 'portal_url')
const API_GET_URL = getIniValue(PORTAL_SECTION, 'get_url')
const API_SEND_URL = getIniValue(PORTAL_SECTION, 'put_url')

exports.getPortalMetaUrl = (id) => {
  if (id) return `${API_PORTAL_URL}/${API_GET_URL.replace(/{{id}}/, id)}`
  return `${API_PORTAL_URL}/${API_GET_URL}`
}
exports.postPortalMetaUrl = () => {
  return `${API_PORTAL_URL}/${API_SEND_URL}`
}
const apiGetUrlElements = this.getPortalMetaUrl().split('/')
const API_GET_PROTOCOL = apiGetUrlElements[0].replace(/:/, '')
const API_GET_PORT = this.API_GET_PROTOCOL === 'https' ? 443 : 80
const API_GET_HOST = apiGetUrlElements[2]
const API_GET_PATH = apiGetUrlElements.splice(3).join('/')

const apiSendUrlElements = this.postPortalMetaUrl().split('/')
const API_SEND_PROTOCOL = apiSendUrlElements[0].replace(/:/, '')
const API_SEND_PORT = API_SEND_PROTOCOL === 'https' ? 443 : 80
const API_SEND_HOST = apiSendUrlElements[2]
const API_SEND_PATH = apiSendUrlElements.splice(3).join('/')

// ----- API: Get

exports.apiGetOptions = (id) => {
  return {
    protocol: API_GET_PROTOCOL,
    hostname: API_GET_HOST,
    port: API_GET_PORT,
    path: API_GET_PATH.replace(/{{id}}/, id),
  }
}

// ----- API: Send

exports.apiSendOptions = () => {
  return {
    protocol: API_SEND_PROTOCOL,
    hostname: API_SEND_HOST,
    port: API_SEND_PORT,
    path: API_SEND_PATH,
  }
}
