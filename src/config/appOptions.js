/* eslint-disable no-console */

const mod = 'appOpts'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { readIniFile } from '../utils/fileActions.js'
import { SEP_LINE, consoleErr, getArgv, isDefined } from '../utils/jsUtils.js'

// -------------------------------------------------------------------------------------------------
// App options / environment variables
// -------------------------------------------------------------------------------------------------
export const OPT_PUBLIC_URL = 'publicUrl'
export const OPT_GIT_HASH = 'hash'
export const OPT_DB_CONNECT_URI = 'dbConnectionUri'
export const OPT_NODE_ENV = 'nodeEnv'
export const OPT_APP_ENV = 'appEnv'
export const OPT_USER_CONF = 'conf'
export const OPT_PROFILES_CONF = 'profiles'
export const OPT_PORTAL_CONF = 'portalConf'
export const OPT_PORT = 'listeningPort'

// -------------------------------------------------------------------------------------------------
// Loading app options
// -------------------------------------------------------------------------------------------------
export const OPTIONS = {
  [OPT_DB_CONNECT_URI]: {
    text: 'DB connection URI (ex: mongodb://rudi-node.org/db_name)',
    cli: 'db_uri',
    env: 'RUDI_API_DB_URI',
    alt: 'RUDI_CATALOG_DB_URI',
  },
  [OPT_NODE_ENV]: {
    text: `Node environment: 'production'|'development'`,
    cli: 'node_env',
    env: 'NODE_ENV',
  },
  [OPT_APP_ENV]: {
    text: `Module environment type: 'production'|'release'|'shared'|'test'`,
    cli: 'app_env',
    env: 'RUDI_API_ENV',
    alt: 'RUDI_CATALOG_ENV',
  },
  [OPT_GIT_HASH]: {
    text: 'Git hash',
    cli: 'hash',
    env: 'RUDI_API_GIT_REV',
    alt: 'RUDI_CATALOG_GIT_REV',
  },
  [OPT_PORT]: {
    text: 'RUDI Catalog server listening port',
    cli: 'port',
    env: 'RUDI_API_PORT',
    alt: 'RUDI_CATALOG_PORT',
  },
  [OPT_PUBLIC_URL]: {
    text: 'RUDI Catalog server public URL',
    cli: 'url',
    env: 'CATALOG_PUBLIC_URL',
    alt: 'RUDI_CATALOG_URL',
  },
  [OPT_USER_CONF]: {
    text: 'User conf file',
    cli: 'conf',
    env: 'RUDI_API_USER_CONF',
    alt: 'RUDI_CATALOG_USER_CONF',
  },
  [OPT_PROFILES_CONF]: {
    text: 'Profiles conf file',
    cli: 'profiles',
    env: 'RUDI_API_PROFILES_CONF',
    alt: 'RUDI_CATALOG_PROFILES_CONF',
  },
  [OPT_PORTAL_CONF]: {
    text: 'Portal conf file',
    cli: 'portal_conf',
    env: 'RUDI_API_PORTAL_CONF',
    alt: 'RUDI_CATALOG_PORTAL_CONF',
  },
}

let longestOptName = 0
let longestCliOpt = 0
let longestEnvOpt = 0
let longestText = 0
Object.keys(OPTIONS).forEach((key) => {
  longestOptName = Math.max(longestOptName, key.length)
  longestCliOpt = Math.max(longestCliOpt, OPTIONS[key].cli.length)
  longestEnvOpt = Math.max(longestEnvOpt, OPTIONS[key].env.length)
  longestText = Math.max(longestText, OPTIONS[key].text.length)
})

export function optionsToString() {
  const optionStrParts = ['', SEP_LINE, ' Options to run this app: ']
  Object.keys(OPTIONS).forEach((opt) =>
    optionStrParts.push(
      `    cli: --${OPTIONS[opt].cli.padEnd(longestCliOpt, ' ')}` +
        ` | env: ${OPTIONS[opt].env.padEnd(longestEnvOpt, ' ')}` +
        ` # ${OPTIONS[opt].text.padEnd(longestText, ' ')}`
    )
  )
  optionStrParts.push(SEP_LINE)
  return optionStrParts.join('\n')
}

const USR_OPTIONS = {}
function loadCliOpts() {
  const _argv = getArgv()
  Object.keys(_argv).forEach((cliOpt) => {
    if (cliOpt == '_' || cliOpt == '') return
    let found = false

    for (const appOpt of Object.keys(OPTIONS)) {
      const opt = OPTIONS[appOpt]
      if (opt.cli == cliOpt) {
        USR_OPTIONS[appOpt] = _argv[cliOpt]
        found = true
        // console.log('Command Line option recognized:', cliOpt, '=', USR_OPTIONS[appOpt])
        break
      }
    }
    if (!found) {
      throw new Error(`!!! ERR Command Line option not recognized: --${cliOpt}=${_argv[cliOpt]}`)
    }
  })
  // console.log('CLI options:', USR_OPTIONS)
  return USR_OPTIONS
}

function loadEnvVars() {
  console.log(' Extracted conf values:')
  Object.keys(OPTIONS).forEach((opt) => {
    // console.log(' opt:', opt)
    const cliOpt = USR_OPTIONS[opt]
    if (cliOpt) {
      console.log('    (cli) ' + opt.padEnd(longestOptName) + ' => ' + cliOpt)
    } else {
      const envVar = OPTIONS[opt].env
      const envVal = process.env[envVar]
      if (envVal) {
        USR_OPTIONS[opt] = envVal
        console.log('    (env) ' + opt.padEnd(longestOptName) + ' => ' + envVal)
      } else {
        const altEnvVar = OPTIONS[opt].alt
        const altEnvVal = process.env[altEnvVar]
        if (altEnvVal) {
          USR_OPTIONS[opt] = altEnvVal
          console.log('    (env) ' + opt.padEnd(longestOptName) + ' => ' + altEnvVal)
        }
      }
    }
  })
}

export const getCliEnvOpt = (opt) => {
  if (Object.keys(USR_OPTIONS).length == 0) {
    console.log(optionsToString())
    loadCliOpts()
    loadEnvVars()
    console.log(SEP_LINE + '\n') ///////////////////////////////////////////////////////////////////
  }
  return opt ? USR_OPTIONS[opt] : USR_OPTIONS
}

// -------------------------------------------------------------------------------------------------
// Extracting configuration files information
// -------------------------------------------------------------------------------------------------

// Conf files name
// - directory
const INI_DIR = './0-ini'
// - user conf path
const userConfPath = getCliEnvOpt(OPT_USER_CONF)
const USER_CONF_FILE = userConfPath || `${INI_DIR}/conf_custom.ini`
// - default conf path
const DEFAULT_CONF_FILE = `${INI_DIR}/conf_default.ini`

if (!userConfPath) {
  consoleErr(
    mod,
    'Extract conf file path',
    'No path has been given for the conf file, check your configuration!' +
      ` Now loading file from path '${USER_CONF_FILE}'`
  )
}
// consoleLog(mod, 'init', USER_CONF_FILE)

export const readConf = (conf, section, opt) => (opt ? conf[section]?.[opt] : conf[section])

// -------------------------------------------------------------------------------------------------
// Extracting user configuration
// -------------------------------------------------------------------------------------------------

const USER_CONF = readIniFile(USER_CONF_FILE)
const getUserConf = (section, opt) => readConf(USER_CONF, section, opt)

// -------------------------------------------------------------------------------------------------
// Extracting default configuration
// -------------------------------------------------------------------------------------------------

const DEFAULT_CONF = readIniFile(DEFAULT_CONF_FILE)
const getDefaultConf = (section, opt) => readConf(DEFAULT_CONF, section, opt)

// -------------------------------------------------------------------------------------------------
// Accessing configuration
// -------------------------------------------------------------------------------------------------

export const getConf = (section, opt, altValue) => {
  if (!section) throw new Error(`Can't get empty conf section`)
  const userConf = getUserConf(section, opt)
  if (isDefined(userConf)) return userConf
  const defaultConf = getDefaultConf(section, opt)
  if (isDefined(defaultConf)) return defaultConf
  if (isDefined(altValue)) return altValue
  throw new Error(
    `Configuration not found:' ${section}.${opt}' -> userConf=${userConf}, defaultConf=${defaultConf}`
  )
}
