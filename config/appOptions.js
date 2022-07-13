/* eslint-disable no-console */
// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import { execSync } from 'child_process'

// -------------------------------------------------------------------------------------------------
// App options: environment variables
// -------------------------------------------------------------------------------------------------
export const OPT_GIT_HASH = 'hash'

export const OPT_NODE_ENV = 'nodeEnv'
export const OPT_APP_ENV = 'appEnv'

export const OPT_USER_CONF = 'conf'
export const OPT_PORTAL_CONF = 'portalConf'

export const OPT_SERVER_URL = 'apiUrl'

export const ENV_USER_CONF = 'RUDI_API_USER_CONF'
// -------------------------------------------------------------------------------------------------
// App options
// -------------------------------------------------------------------------------------------------
export const OPTIONS = {
  [OPT_NODE_ENV]: {
    text: 'Node environment: production | development',
    env: 'NODE_ENV',
    cli: '--node_env',
  },
  [OPT_APP_ENV]: {
    text: 'Module environment type: production | release | shared | test',
    cli: '--app_env',
    env: 'RUDI_API_ENV',
  },
  [OPT_GIT_HASH]: {
    text: 'Git hash',
    cli: '--hash',
    env: 'RUDI_API_GIT_REV',
  },
  [OPT_USER_CONF]: {
    text: 'User conf file',
    cli: '--conf',
    env: ENV_USER_CONF,
  },
  [OPT_PORTAL_CONF]: {
    text: 'Portal conf file',
    cli: '--portal_conf',
    env: 'RUDI_API_PORTAL_CONF',
  },
  [OPT_SERVER_URL]: {
    text: 'API server URL',
    cli: '--url',
    env: 'RUDI_API_URL',
  },
}

let ARE_APP_OPTIONS_LOADED = false
const APP_OPTIONS = {}

export const loadAppOptions = () => {
  if (ARE_APP_OPTIONS_LOADED) return
  const SEP_LINE = '----------------------------------------------------'
  console.log('\n' + SEP_LINE) ///////////////////////////////////////////////////////////////////////

  console.log(' Options to run this app: ')
  Object.keys(OPTIONS).map((opt) =>
    console.log(
      '    cli: ' +
        OPTIONS[opt].cli +
        (OPTIONS[opt].cli?.length < 8 ? '\t' : '') +
        '\t| env: ' +
        OPTIONS[opt].env
    )
  )
  console.log(SEP_LINE) //////////////////////////////////////////////////////////////////////////////
  // -------------------------------------------------------------------------------------------------
  // Extract command line arguments
  // -------------------------------------------------------------------------------------------------
  const cliOptionsValues = {}
  process.argv.map((cliArg) => {
    Object.keys(OPTIONS).map((appOpt) => {
      const appOptForCli = OPTIONS[appOpt].cli + '='
      if (OPTIONS[appOpt].cli && cliArg.startsWith(appOptForCli))
        cliOptionsValues[appOpt] = cliArg.substring(appOptForCli.length)
    })
  })

  // -------------------------------------------------------------------------------------------------
  // Definitive conf values
  // -------------------------------------------------------------------------------------------------
  console.log(' Extracted conf values:')
  Object.keys(OPTIONS).map((opt) => {
    if (cliOptionsValues[opt]) {
      APP_OPTIONS[opt] = cliOptionsValues[opt]
      console.log('    (cli) ' + opt + ' => ' + APP_OPTIONS[opt])
    } else {
      const envVar = OPTIONS[opt].env
      if (process.env[envVar]) {
        APP_OPTIONS[opt] = process.env[envVar]
        console.log('    (env) ' + opt + ' => ' + APP_OPTIONS[opt])
      }
    }
  })
  console.log(SEP_LINE + '\n') ///////////////////////////////////////////////////////////////////////

  // conf: CLI_OPTIONS.conf.cli || process.env[RUDI_API_USER_CONF],
  // portal_conf: CLI_OPTIONS.portal_conf || process.env[RUDI_API_USER_CONF],
  // }
  ARE_APP_OPTIONS_LOADED = true
}

export const getAppOptions = (opt, altValue) => (opt ? APP_OPTIONS[opt] || altValue : APP_OPTIONS)

export const getGitHash = () => {
  try {
    return getAppOptions(OPT_GIT_HASH) || `${execSync('git rev-parse --short HEAD')}`.trim()
  } catch (err) {
    console.error(err)
    throw err
  }
}

loadAppOptions()
