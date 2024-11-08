const mod = 'confPortal'

import { readIniFile } from '../utils/fileActions.js'
// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import {
  consoleErr,
  createBasicAuth,
  decodeBase64url,
  isDefined,
  pathJoin,
  separateLogs,
} from '../utils/jsUtils.js'

import { logD } from '../utils/logging.js'
import { OPT_PORTAL_CONF, getCliEnvOpt, readConf } from './appOptions.js'
import { USER_AGENT } from './constApi.js'

separateLogs('Portal conf', true) ////////////////////////////////////////////////////////

// -------------------------------------------------------------------------------------------------
// Constants: Portal JWT properties
// -------------------------------------------------------------------------------------------------
export const PARAM_TOKEN = 'token'
export const FIELD_TOKEN = 'access_token'
export const JWT_USER = 'user_name'

export const NO_PORTAL_MSG = 'No portal connected'

// -------------------------------------------------------------------------------------------------
// Constants: Portal configuration
// -------------------------------------------------------------------------------------------------
// Conf files
// - directory
const INI_DIR = './0-ini'
// - user conf path
const portalConfUserFile = getCliEnvOpt(OPT_PORTAL_CONF)
const PORTAL_CUSTOM_CONF_FILE = portalConfUserFile || `${INI_DIR}/portal_conf_custom.ini`
// - default conf path
const PORTAL_DEFT_CONF_FILE = `${INI_DIR}/portal_conf_default.ini`

if (!portalConfUserFile) {
  consoleErr(
    mod,
    'Extract portal conf file path',
    'No path has been given for this conf file, check your configuration!' +
      ` Now loading file from path '${PORTAL_CUSTOM_CONF_FILE}'`
  )
}

// -------------------------------------------------------------------------------------------------
// Constants: user and local configuration
// -------------------------------------------------------------------------------------------------
// Getting user conf file value
// if null, local conf file value
// if null , default value
const portalUserConf = readIniFile(PORTAL_CUSTOM_CONF_FILE)
const getPortalUserConf = (opt) => readConf(portalUserConf, 'portal', opt)
const defaultUserConf = readIniFile(PORTAL_DEFT_CONF_FILE)
const getPortalDefaultConf = (opt) => readConf(defaultUserConf, 'portal', opt)

export const getPortalConf = (opt) => {
  const userConf = getPortalUserConf(opt)
  if (isDefined(userConf)) return userConf
  const defaultConf = getPortalDefaultConf(opt)
  if (isDefined(defaultConf)) return defaultConf
  throw new Error(
    `Configuration not found: '${opt}' -> portalUserConf=${userConf}, portalDefaultConf=${defaultConf}`
  )
}

// -------------------------------------------------------------------------------------------------
// Extracting and exporting sys configuration
// -------------------------------------------------------------------------------------------------
const API_PORTAL_URL = getPortalUserConf('portal_url')
export const isPortalConnectionDisabled = () => !API_PORTAL_URL?.startsWith('http')

// ----- Auth
const AUTH_URL = getPortalUserConf('auth_url') || API_PORTAL_URL
const AUTH_GET = getPortalConf('auth_get')
const AUTH_CHK = getPortalConf('auth_chk')
const JWT_PUB_KEY_URL = getPortalConf('auth_pub')
const CRYPT_PUB_KEY_URL = getPortalConf('encrypt_pub')

export const getAuthUrl = () => pathJoin(AUTH_URL, AUTH_GET)
export const getCheckAuthUrl = () => pathJoin(AUTH_URL, AUTH_CHK)
export const getPortalJwtPubKeyUrl = () => pathJoin(AUTH_URL, JWT_PUB_KEY_URL)
export const getPortalCryptPubUrl = () => pathJoin(AUTH_URL, CRYPT_PUB_KEY_URL)

// ----- Creds
const uname = getPortalUserConf('login')
const passw = getPortalUserConf('passw')
const isPwdB64 = getPortalUserConf('is_pwd_b64')
const pwdEncoding = isPwdB64 ? 'base64' : 'utf-8'

const BAUTH = createBasicAuth(uname, passw, 'utf-8', pwdEncoding)
const BAUTH_HEADERS_BASIC = {
  headers: { 'User-Agent': USER_AGENT, Authorization: `Basic ${BAUTH}` },
}
const PORTAL_TOKEN_REQ_BODY =
  `grant_type=password&scope=read&username=${encodeURIComponent(uname)}&` +
  `password=${encodeURIComponent(isPwdB64 ? decodeBase64url(passw) : passw)}`

// consoleLog(mod, 'readPortalConf',`READ_PASSW: ${READ_PASSW}` )

export const getCredentials = (headersOnly) =>
  headersOnly ? BAUTH_HEADERS_BASIC : [BAUTH_HEADERS_BASIC, PORTAL_TOKEN_REQ_BODY]

// ----- API
export const getPortalBaseUrl = () => API_PORTAL_URL || NO_PORTAL_MSG

const API_GET_URL = getPortalConf('get_url')
const API_SEND_URL = getPortalConf('put_url')

export const getPortalMetaUrl = (id, additionalParameters) => {
  if (isPortalConnectionDisabled()) return NO_PORTAL_MSG
  const reqUrl = !id
    ? pathJoin(API_PORTAL_URL, API_GET_URL.replace('/{{id}}', ''))
    : pathJoin(API_PORTAL_URL, API_GET_URL.replace('{{id}}', id))
  const options = additionalParameters ? `?${additionalParameters}` : ''
  return `${reqUrl}${options}`
}
export const postPortalMetaUrl = (id) => pathJoin(API_PORTAL_URL, API_SEND_URL, id)

const apiGetUrlElements = getPortalMetaUrl().split('/')
const API_GET_PROTOCOL = apiGetUrlElements[0].replace(/:/, '')
const API_GET_PORT = API_GET_PROTOCOL === 'https' ? 443 : 80
const API_GET_HOST = apiGetUrlElements[2]
const API_GET_PATH = apiGetUrlElements.splice(3).join('/')

const apiSendUrlElements = postPortalMetaUrl().split('/')
const API_SEND_PROTOCOL = apiSendUrlElements[0].replace(/:/, '')
const API_SEND_PORT = API_SEND_PROTOCOL === 'https' ? 443 : 80
const API_SEND_HOST = apiSendUrlElements[2]
const API_SEND_PATH = apiSendUrlElements.splice(3).join('/')

// ----- API: Get

export const apiGetOptions = (id) => {
  return {
    protocol: API_GET_PROTOCOL,
    hostname: API_GET_HOST,
    port: API_GET_PORT,
    path: API_GET_PATH?.replace(/{{id}}/, id),
  }
}

// ----- API: Send

export const apiSendOptions = () => {
  return {
    protocol: API_SEND_PROTOCOL,
    hostname: API_SEND_HOST,
    port: API_SEND_PORT,
    path: API_SEND_PATH,
  }
}

// ----- Feedback
if (isPortalConnectionDisabled()) {
  logD(mod, '', NO_PORTAL_MSG)
} else {
  logD(mod, '', `Portal - Data: '${API_PORTAL_URL}'`)
  logD(mod, '', `Portal - Auth: '${AUTH_URL}'`)
}

// -------------------------------------------------------------------------------------------------
// Portal constants
// -------------------------------------------------------------------------------------------------
export const PORTAL_MIMES = [
  'application/geo+json',
  'application/graphql',
  'application/javascript',
  'application/json',
  'application/ld+json',
  'application/msword',
  'application/pdf',
  'application/sql',
  'application/vnd.api+json',
  'application/vnd.ms-excel',
  'application/vnd.ms-powerpoint',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/x-executable',
  'application/x-www-form-urlencoded',
  'application/xml',
  'application/zip',
  'application/zstd',
  'audio/mpeg',
  'audio/ogg',
  'image/apng',
  'image/flif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/x-mng',
  'multipart/form-data',
  'text/css',
  'text/csv',
  'text/html',
  'text/php',
  'text/plain',
  'text/x-yaml',
  'text/xml',
  'application/graphql+crypt',
  'application/javascript+crypt',
  'application/json+crypt',
  'application/ld+json+crypt',
  'application/msword+crypt',
  'application/pdf+crypt',
  'application/sql+crypt',
  'application/vnd.api+json+crypt',
  'application/vnd.ms-excel+crypt',
  'application/vnd.ms-powerpoint+crypt',
  'application/vnd.oasis.opendocument.text+crypt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation+crypt',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet+crypt',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document+crypt',
  'application/x-executable+crypt',
  'application/x-www-form-urlencoded+crypt',
  'application/xml+crypt',
  'application/zip+crypt',
  'application/zstd+crypt',
  'audio/mpeg+crypt',
  'audio/ogg+crypt',
  'image/apng+crypt',
  'image/flif+crypt',
  'image/gif+crypt',
  'image/jpeg+crypt',
  'image/png+crypt',
  'image/webp+crypt',
  'image/x-mng+crypt',
  'multipart/form-data+crypt',
  'text/css+crypt',
  'text/csv+crypt',
  'text/html+crypt',
  'text/php+crypt',
  'text/plain+crypt',
  'text/x-yaml+crypt',
  'text/xml+crypt',
]

export const isPortalMime = (mimeType) => PORTAL_MIMES.indexOf(mimeType) > -1
