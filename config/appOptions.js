/* eslint-disable no-console */
// ------------------------------------------------------------------------------------------------
// App options: command line
// ------------------------------------------------------------------------------------------------

// ------------------------------------------------------------------------------------------------
// App options: environment variables
// ------------------------------------------------------------------------------------------------
exports.OPT_GIT_HASH = 'hash'

exports.OPT_NODE_ENV = 'nodeEnv'
exports.OPT_APP_ENV = 'appEnv'

exports.OPT_USER_CONF = 'conf'
exports.OPT_PORTAL_CONF = 'portalConf'

// ------------------------------------------------------------------------------------------------
// App options
// ------------------------------------------------------------------------------------------------
exports.OPTIONS = {
  [this.OPT_GIT_HASH]: {
    text: 'Git hash',
    cli: '--hash',
    env: 'RUDI_API_GIT_REV',
  },
  [this.OPT_NODE_ENV]: {
    text: 'Node environment: production | development',
    env: 'NODE_ENV',
    cli: '--node_env',
  },
  [this.OPT_APP_ENV]: {
    text: 'Module environment type: production | release | shared | test',
    cli: '--app_env',
    env: 'RUDI_API_ENV',
  },
  [this.OPT_USER_CONF]: {
    text: 'User conf file',
    cli: '--conf',
    env: 'RUDI_API_USER_CONF',
  },
  [this.OPT_PORTAL_CONF]: {
    text: 'Portal conf file',
    cli: '--portal_conf',
    env: 'RUDI_API_PORTAL_CONF',
  },
}

console.log('--------------------------------------------------------------')

console.log('Options to run this app: ')
Object.keys(this.OPTIONS).map((opt) =>
  console.log(
    '    cli: ' +
      this.OPTIONS[opt].cli +
      (this.OPTIONS[opt].cli?.length < 8 ? '\t' : '') +
      '\t| env: ' +
      this.OPTIONS[opt].env
  )
)
console.log('--------------------------------------------------------------')
// ------------------------------------------------------------------------------------------------
// Extract command line arguments
// ------------------------------------------------------------------------------------------------
const cliOptionsValues = {}
process.argv.map((cliArg) => {
  Object.keys(this.OPTIONS).map((appOpt) => {
    const appOptForCli = this.OPTIONS[appOpt].cli + '='
    if (this.OPTIONS[appOpt].cli && cliArg.startsWith(appOptForCli))
      cliOptionsValues[appOpt] = cliArg.substring(appOptForCli.length)
  })
})

// ------------------------------------------------------------------------------------------------
// Definitive conf values
// ------------------------------------------------------------------------------------------------
console.log('Extracted conf values:')
const appOptionsValues = {}
Object.keys(this.OPTIONS).map((opt) => {
  if (cliOptionsValues[opt]) {
    appOptionsValues[opt] = cliOptionsValues[opt]
    console.log('    (cli) ' + opt + ' => ' + appOptionsValues[opt])
  } else {
    const envVar = this.OPTIONS[opt].env
    if (process.env[envVar]) {
      appOptionsValues[opt] = process.env[envVar]
      console.log('    (env) ' + opt + ' => ' + appOptionsValues[opt])
    }
  }
})
console.log('--------------------------------------------------------------')

// conf: CLI_OPTIONS.conf.cli || process.env[this.RUDI_API_USER_CONF],
// portal_conf: CLI_OPTIONS.portal_conf || process.env[this.RUDI_API_USER_CONF],
// }

exports.getAppOptions = (opt, altValue) =>
  opt ? appOptionsValues[opt] || altValue : appOptionsValues

exports.getGitHash = () => {
  try {
    return (
      this.getAppOptions(this.OPT_GIT_HASH) ||
      `${require('child_process').execSync('git rev-parse --short HEAD')}`.trim()
    )
  } catch (err) {
    console.error(err)
    throw err
  }
}
