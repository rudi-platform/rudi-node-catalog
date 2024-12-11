const mod = 'sysConf'
// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import { execSync } from 'child_process'

// -------------------------------------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------------------------------------
import {
  OPT_APP_ENV,
  OPT_DB_CONNECT_URI,
  OPT_GIT_HASH,
  OPT_NODE_ENV,
  OPT_PORT,
  OPT_PROFILES_CONF,
  OPT_PUBLIC_URL,
  getCliEnvOpt,
  getConf,
} from './appOptions.js'
import { TRACE, TRACE_ERR, TRACE_FUN, TRACE_MOD } from './constApi.js'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import {
  consoleErr,
  consoleLog,
  pathJoin,
  removeTrailingSlash,
  separateLogs,
} from '../utils/jsUtils.js'

import { readIniFile } from '../utils/fileActions.js'

separateLogs('Loading sys conf', true) ///////////////////////////////////////////////////////////

// -------------------------------------------------------------------------------------------------
// Constants: local ini file configuration settings
// -------------------------------------------------------------------------------------------------
let CURRENT_APP_HASH

// -------------------------------------------------------------------------------------------------
// Display app options
// -------------------------------------------------------------------------------------------------
// if (utils.isNotEmptyObject(appOptions))
//   consoleLog(mod, 'commandLineOptions', utils.beautify(appOptions))

// -------------------------------------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------------------------------------

// -------------------------------------------------------------------------------------------------
// Constants: user and local configuration
// -------------------------------------------------------------------------------------------------
// Getting user conf file value
// if null, local conf file value
// if null , default value

// -------------------------------------------------------------------------------------------------
// Helper functions
// -------------------------------------------------------------------------------------------------

// -------------------------------------------------------------------------------------------------
// Extracting and exporting sys configuration
// -------------------------------------------------------------------------------------------------

// ----- Flags section
const FLAGS_SECTION = 'flags'

const SHOULD_CONTROL_PRIVATE_REQUESTS = getConf(FLAGS_SECTION, 'should_control_private_requests')
const SHOULD_CONTROL_PUBLIC_REQUESTS = getConf(FLAGS_SECTION, 'should_control_public_requests')

export const shouldControlPrivateRequests = () => SHOULD_CONTROL_PRIVATE_REQUESTS
export const shouldControlPublicRequests = () => SHOULD_CONTROL_PUBLIC_REQUESTS

// ----- Node Server section
const SERVER_SECTION = 'server'

const APP_NAME = getConf(SERVER_SECTION, 'app_name')
const LISTENING_ADDR = removeTrailingSlash(getConf(SERVER_SECTION, 'listening_address'))
const LISTENING_PORT = getCliEnvOpt(OPT_PORT) || getConf(SERVER_SECTION, 'listening_port')
const CATALOG_PREFIX = removeTrailingSlash(getConf(SERVER_SECTION, 'server_prefix') || 'api')

export const getCatalog = (...url) => pathJoin('', CATALOG_PREFIX, ...url)
export const getPrivatePath = (...url) => getCatalog('admin', ...url)
export const getPublicPath = (...url) => getCatalog('v1', ...url)

let publicUrl = getCliEnvOpt(OPT_PUBLIC_URL) || getConf(SERVER_SECTION, 'server_url')
if (!publicUrl.endsWith(CATALOG_PREFIX)) publicUrl = pathJoin(publicUrl, CATALOG_PREFIX)
const PUBLIC_URL = removeTrailingSlash(publicUrl)

export const getAppName = () => APP_NAME
export const getServerAddress = () => LISTENING_ADDR
export const getServerPort = () => LISTENING_PORT
export const getHost = (suffix) =>
  pathJoin(`http://${LISTENING_ADDR}:${LISTENING_PORT}`, CATALOG_PREFIX, suffix)

export const getPublicUrl = (suffix) => pathJoin(PUBLIC_URL, suffix)

// ----- App environment
const NODE_ENV = getCliEnvOpt(OPT_NODE_ENV) || 'dev'
export const getNodeEnv = () => NODE_ENV

const APP_ENV = getCliEnvOpt(OPT_APP_ENV)
export const getAppEnv = () => APP_ENV

let GIT_HASH = `n/a`
try {
  GIT_HASH =
    getCliEnvOpt(OPT_GIT_HASH) ||
    `${execSync('git rev-parse --short HEAD', { encoding: 'utf-8' })}`.trim()
} catch (err) {
  consoleErr(mod, 'getGitHash', err)
  // throw err
}

export const getGitHash = () => GIT_HASH

// ----- DB section
const DB_SECTION = 'database'

const DB_URI =
  getCliEnvOpt(OPT_DB_CONNECT_URI) ||
  getConf(DB_SECTION, 'db_connection_uri') ||
  pathJoin(
    getConf(DB_SECTION, 'db_url') || 'mongodb://127.0.0.1',
    getConf(DB_SECTION, 'db_name') || 'rudi_catalog'
  )

export const getDbFullUri = () => DB_URI

// const DB_DUMP_DIR = getConf(DB_SECTION, 'db_dump_dir')
// export const getDbDumpDir = () => DB_DUMP_DIR

// ----- Security section
const PROFILES = readIniFile(getCliEnvOpt(OPT_PROFILES_CONF) || getConf('security', 'profiles'))

export const getProfile = (subject) => {
  if (!subject)
    throw new Error({
      code: 403,
      name: 'Forbidden',
      message: `No subject provided for profile access`,
    })
  if (!PROFILES[subject])
    throw new Error({
      code: 403,
      name: 'Forbidden',
      message: `Profile not found for subject: ${subject}`,
    })
  return PROFILES[subject]
}

// const now = utils.nowLocaleFormatted()
const appMsg = `App '${APP_NAME}' listening on: ${getHost()}`
consoleLog(mod, 'init', appMsg)
consoleLog(mod, 'init', `Public URL: ${getPublicUrl()}`)
consoleLog(mod, 'init', `DB: ${DB_URI}`)

// ----- SKOSMOS section
const SKOSMOS_SECTION = 'skosmos'
const skosmosConfFile = getConf(SKOSMOS_SECTION, 'skosmos_conf', false)

let SKOSMOS_CONF
try {
  if (skosmosConfFile) SKOSMOS_CONF = readIniFile(skosmosConfFile)
} catch (e) {
  consoleErr(mod, 'skosmosConfFile', e)
}
export const getSkosmosConf = (prop) => (prop ? SKOSMOS_CONF?.[prop] : SKOSMOS_CONF)

// -------------------------------------------------------------------------------------------------
// App ID
// -------------------------------------------------------------------------------------------------

/** @returns the git hash of the last time the app was launched */
export const getAppHash = () => {
  const fun = 'getCurrentAppId'
  try {
    if (!CURRENT_APP_HASH) CURRENT_APP_HASH = getGitHash()
    return CURRENT_APP_HASH
  } catch (err) {
    const error = new Error(`No git hash: ${err}`)
    error[TRACE] = [{ [TRACE_MOD]: mod, [TRACE_FUN]: fun, [TRACE_ERR]: err }]
    throw error
  }
}
