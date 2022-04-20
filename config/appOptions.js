/* eslint-disable no-console */
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
    cli: '--hash',
    env: this.RUDI_API_GIT_REV,
  },
  node_env: {
    text: 'Node environment: production | development',
    env: this.NODE_ENV,
    cli: '--node_env',
  },
  app_env: {
    text: 'Module environment type: production | release | shared | test',
    cli: '--app_env',
    env: this.RUDI_API_ENV,
  },
  conf: {
    text: 'User conf file',
    cli: '--conf',
    env: this.RUDI_API_USER_CONF,
  },
  portal_conf: {
    text: 'Portal conf file',
    cli: '--portal_conf',
    env: this.RUDI_API_PORTAL_CONF,
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

exports.getAppOptions = (opt) => (opt ? appOptionsValues[opt] : appOptionsValues)
