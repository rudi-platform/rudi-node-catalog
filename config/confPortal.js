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
const LOGIN = getIniValue(PORTAL_SECTION, 'login')
const PASSW = getIniValue(PORTAL_SECTION, 'passw')
const SHOULD_CONTROL_EXT_REQUESTS = getIniValue(PORTAL_SECTION, 'should_control_public_requests')

exports.getCredentials = () => {
  return [LOGIN, PASSW]
}

// const SECRET = getIniValue(PORTAL_SECTION, _secret)
exports.getSecret = () => {
  return null
}

exports.shouldControlExtRequest = () => {
  return SHOULD_CONTROL_EXT_REQUESTS
}

// ----- API
const API_GET_URL = getIniValue(PORTAL_SECTION, 'get_url')
const API_SEND_URL = getIniValue(PORTAL_SECTION, 'put_url')

const apiGetUrlElements = API_GET_URL.split('/')
const API_GET_PROTOCOL = apiGetUrlElements[0].replace(/:/, '')
const API_GET_PORT = this.API_GET_PROTOCOL === 'https' ? 443 : 80
const API_GET_HOST = apiGetUrlElements[2]
const API_GET_PATH = apiGetUrlElements.splice(3).join('/')

const apiSendUrlElements = API_SEND_URL.split('/')
const API_SEND_PROTOCOL = apiSendUrlElements[0].replace(/:/, '')
const API_SEND_PORT = API_SEND_PROTOCOL === 'https' ? 443 : 80
const API_SEND_HOST = apiSendUrlElements[2]
const API_SEND_PATH = apiSendUrlElements.splice(3).join('/')

// ----- API: Get
exports.getPortalMetaUrl = (id) => {
  return `${API_GET_URL.replace(/{{id}}/, id)}`
}

exports.apiGetOptions = (id) => {
  return {
    protocol: API_GET_PROTOCOL,
    hostname: API_GET_HOST,
    port: API_GET_PORT,
    path: API_GET_PATH.replace(/{{id}}/, id),
  }
}

// ----- API: Send
exports.postPortalMetaUrl = () => {
  return `${API_SEND_URL}`
}
exports.apiSendOptions = () => {
  return {
    protocol: API_SEND_PROTOCOL,
    hostname: API_SEND_HOST,
    port: API_SEND_PORT,
    path: API_SEND_PATH,
  }
}
