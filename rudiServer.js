'use strict'

const mod = 'main'

// ------------------------------------------------------------------------------------------------
// Internal dependancies
// ------------------------------------------------------------------------------------------------
const utils = require('./utils/jsUtils')
const sys = require('./config/confSystem')
require('./config/confLogs')
const log = require('./utils/logging')

const api = require('./config/confApi')
const sysController = require('./controllers/sysController')
const { addLogEntry } = require('./db/dbQueries')

// ------------------------------------------------------------------------------------------------
// Prerequisites
// ------------------------------------------------------------------------------------------------
// Fixing Regexp display as a string
RegExp.prototype.toJSON = RegExp.prototype.toString

// ------------------------------------------------------------------------------------------------
// External dependancies / init
// ------------------------------------------------------------------------------------------------
// Require external modules
const mongoose = require('mongoose')
const fastify = require('./routes/fastify')
// Import Swagger Options
// const swagger = require('./config/swagger')

// Register Swagger
// fastify.register(require('fastify-swagger'), swagger.options)

// ------------------------------------------------------------------------------------------------
// DB connection
// ------------------------------------------------------------------------------------------------

// Setting flags to avoid deprecation warnings
mongoose.set('useFindAndModify', false)

const mongoConnectOptions = {
  useUnifiedTopology: true,
  useCreateIndex: true,
  useNewUrlParser: true,
}

const logSeparatorConf =
  '---------------------------------------------------------------[Conf OK]--'
// eslint-disable-next-line no-console
console.log(utils.nowLocaleFormatted(), logSeparatorConf)
addLogEntry('info', 'app', 'logSeparatorConf', logSeparatorConf).catch((err) =>
  utils.consoleErr('info', 'app', 'logSeparatorConf: ' + err)
)

log.i(mod, 'mongo', `Connecting to [${sys.DB_URL}]`)
mongoose
  .connect(sys.DB_URL, mongoConnectOptions)
  .then(() => {
    log.i(mod, 'mongo', `MongoDB connected`)
    const startMsg =
      `API v${api.VERSION} ` +
      `| App version: '${sysController.getAppHash()}' ` +
      `| '${sysController.getEnvironment()}' env`
    log.i(mod, 'app', startMsg)
    log.sysInfo(startMsg)
    const logSeparatorEnd = utils.separateLogs('Init OK')
    addLogEntry('info', 'app', 'logSeparatorEnd', logSeparatorEnd).catch((err) =>
      utils.consoleErr('info', 'app', 'logSeparatorEnd: ' + err)
    )
  })
  .catch((err) => log.e(mod, 'mongoConnection', err))

// ------------------------------------------------------------------------------------------------
// SERVER
// ------------------------------------------------------------------------------------------------
const start = async () => {
  try {
    process.title = sys.APP_NAME
    await fastify
      .listen(sys.LISTENING_PORT, sys.LISTENING_ADDR)
      .catch((err) => log.e(mod, 'Fastify listen', `${err}`))
    // fastify.swagger()
    // fastify.log.info(`Listening on ${fastify.server.address().address}:${fastify.server.address().port}`)
  } catch (err) {
    // fastify.log.error(err)
    log.e(mod, 'exitServer', err)
    process.exit(1)
  }
}

try {
  start()
    .then(() => {
      log.i(mod, 'server', 'Ready')
    })
    .catch((err) => log.e(mod, 'server', `Crashed: ${err}`))
} catch (uncaught) {
  log.e(mod, 'server', `Uncaught error: ${uncaught}`)
}

process.on('uncaughtException', (err) => {
  log.e(mod, 'process', `Uncaught error: ${err}`)
  // console.error('There was an uncaught error', err)
  // process.exit(1) //mandatory (as per the Node.js docs)
})

process.on('unhandledRejection', (error, promise) => {
  const fun = 'catching promise rejection'
  log.e(mod, fun, 'DAMN!!! Promise rejection not handled here: ' + utils.beautify(promise))
  log.e(mod, fun, 'The error was: ' + error)
})
