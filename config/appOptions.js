// ------------------------------------------------------------------------------------------------
// App options: command line
// ------------------------------------------------------------------------------------------------

// ------------------------------------------------------------------------------------------------
// App options: environment variables
// ------------------------------------------------------------------------------------------------
exports.NODE_ENV = 'NODE_ENV'
exports.RUDI_API_ENV = 'RUDI_API_ENV'
exports.RUDI_API_GIT_REV = 'RUDI_API_GIT_REV'
exports.RUDI_API_USER_CONF = 'RUDI_API_USER_CONF'
exports.RUDI_API_PORTAL_CONF = 'RUDI_API_PORTAL_CONF'

// ------------------------------------------------------------------------------------------------
// App options
// ------------------------------------------------------------------------------------------------
exports.OPTIONS = {
  id: {
    text: 'Git hash',
    cli: '--hash=',
    env: this.RUDI_API_GIT_REV,
  },
  node_env: {
    text: 'Node environment: production | development',
    env: this.NODE_ENV,
  },
  env: {
    text: 'Module environment type: release | shared | test',
    cli: '--env=',
    env: this.RUDI_API_ENV,
  },
  conf: {
    text: 'User conf file',
    cli: '--conf=',
    env: this.RUDI_API_USER_CONF,
  },
  portal_conf: {
    text: 'Portal conf file',
    cli: '--portal_conf=',
    env: this.RUDI_API_PORTAL_CONF,
  },
}

// ------------------------------------------------------------------------------------------------
// Extract command line arguments
// ------------------------------------------------------------------------------------------------
const cliOptionsValues = {}
process.argv.map((cliArg) => {
  Object.keys(this.OPTIONS).map((appOpt) => {
    const appOptForCli = this.OPTIONS[appOpt].cli
    if (appOptForCli && cliArg.startsWith(appOptForCli))
      cliOptionsValues[appOpt] = cliArg.substring(appOptForCli.length)
  })
})

// ------------------------------------------------------------------------------------------------
// Definitive conf values
// ------------------------------------------------------------------------------------------------
const appOptionsValues = {}
Object.keys(this.OPTIONS).map((opt) => {
  appOptionsValues[opt] = cliOptionsValues[opt] || process.env[opt.env]
})
// conf: CLI_OPTIONS.conf.cli || process.env[this.RUDI_API_USER_CONF],
// portal_conf: CLI_OPTIONS.portal_conf || process.env[this.RUDI_API_USER_CONF],
// }

exports.getAppOptions = (opt) => (opt ? appOptionsValues[opt] : appOptionsValues)
