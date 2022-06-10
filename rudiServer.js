'use strict'

const mod = 'main'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
const utils = require('./utils/jsUtils')

utils.separateLogs('Loading conf', true) ///////////////////////////////////////////////////////////
const sys = require('./config/confSystem')
require('./config/confLogs')

const api = require('./config/confApi')

// -------------------------------------------------------------------------------------------------
// Prerequisites
// -------------------------------------------------------------------------------------------------
// Fixing Regexp display as a string
RegExp.prototype.toJSON = RegExp.prototype.toString

// -------------------------------------------------------------------------------------------------
// External dependencies / init
// -------------------------------------------------------------------------------------------------
// Require external modules
utils.separateLogs('Connecting to DB', true) ///////////////////////////////////////////////////////

const mongoose = require('mongoose')

// Import Swagger Options
// const swagger = require('./config/swagger')

// Register Swagger
// fastify.register(require('fastify-swagger'), swagger.options)

// -------------------------------------------------------------------------------------------------
// DB connection
// -------------------------------------------------------------------------------------------------

// Setting flags to avoid deprecation warnings
// mongoose.set('useFindAndModify', false)

// const mongoConnectOptions = {
// useUnifiedTopology: true,
// useCreateIndex: true,
// useNewUrlParser: true,
// }

const sysController = require('./controllers/sysController')
const log = require('./utils/logging')

utils.consoleLog(mod, 'mongo', `Connecting to [${sys.getDbUrl()}]`)

mongoose
  .connect(sys.getDbUrl())
  .then(() => {
    log.i(mod, 'mongo', `MongoDB connected`)

    try {
      start().catch((err) => {
        log.e(mod, 'server', `Crashed: ${err}`)
        log.sysCrit(`Server crashed: ${err}`, 'rudiServer.running', {}, { error: err })
      })
    } catch (err) {
      log.e(mod, 'server', `Uncaught error: ${err}`)
      log.sysCrit(`Uncaught error: ${err}`, 'rudiServer.uncaughtError', {}, { error: err })
    }
  })
  .catch((err) => {
    log.e(mod, 'mongoConnection', err)
    log.sysCrit(`Mongo connection: ${err}`, 'rudiServer.dbConnect', {}, { error: err })
    process.exit(1)
    // throw RudiError.treatError(mod, 'mongoConnection', err)
  })

// -------------------------------------------------------------------------------------------------
// SERVER
// -------------------------------------------------------------------------------------------------
const start = async () => {
  const fun = 'start'
  try {
    utils.separateLogs('Handling rejections', true) ////////////////////////////////////////////////

    process.title = sys.getAppName()

    process.on('uncaughtException', (err) => {
      log.e(mod, 'process', `Uncaught exception: ${err}`)
      log.sysCrit(`Uncaught exception: ${err}`, 'rudiServer.uncaughtException', {}, { error: err })
      // console.error('There was an uncaught error', err)
      // process.exit(1) //mandatory (as per the Node.js docs)
    })

    process.on('unhandledRejection', (err, promise) => {
      const fun = 'catching promise rejection'
      log.e(mod, fun, 'DAMN!!! Promise rejection not handled here: ' + utils.beautify(promise))
      log.e(mod, fun, 'The error was: ' + err)
      log.sysCrit(
        `Promise rejection not handled: ${utils.beautify(promise)})`,
        'rudiServer.promiseUnhandled',
        {},
        {
          promise: utils.beautify(promise),
        }
      )
      log.sysCrit(`Promise rejection error: ${err}`, 'rudiServer.on', {}, { error: err })
    })

    utils.separateLogs('Portal conf', true) ////////////////////////////////////////////////////////
    require('./config/confPortal')

    utils.separateLogs('Routes', true) /////////////////////////////////////////////////////////////

    const fastify = require('./routes/fastify')
    await fastify
      .listen(sys.getServerPort(), sys.getServerAddress())
      .catch((err) => log.e(mod, 'Fastify listen', `${err}`))
    // fastify.swagger()
    // fastify.log.info(`Listening on ${fastify.server.address().address}:${fastify.server.address().port}`)

    utils.separateLogs('Models', true) /////////////////////////////////////////////////////////////
    const { LogEntry } = require('./definitions/models/LogEntry')
    const { Contact } = require('./definitions/models/Contact')
    const { Organization } = require('./definitions/models/Organization')
    const { Media } = require('./definitions/models/Media')
    const { Metadata } = require('./definitions/models/Metadata')
    const Keywords = require('./definitions/thesaurus/Keywords')
    const Themes = require('./definitions/thesaurus/Themes')

    await Promise.all(
      [LogEntry, Contact, Organization, Media, Metadata, Keywords, Themes].map((model) =>
        model.initialize()
      )
    )

    utils.separateLogs('Start', true) //////////////////////////////////////////////////////////////
    const appVer = sysController.getAppHash()
    const curEnv = sysController.getEnvironment()
    const startMsg =
      `API v${api.API_VERSION} ` + `| App version: '${appVer}' ` + `| '${curEnv}' env`
    log.i(mod, fun, startMsg)
    log.sysInfo(startMsg, '', '', ' ')
    log.i(mod, 'server', 'Ready')

    const logSeparatorEnd = utils.separateLogs('Init OK', true) //////////////////////////////////////////
    log
      .addLogEntry('info', 'app', 'logSeparatorEnd', logSeparatorEnd)
      .catch((err) => utils.consoleErr('info', 'app', 'logSeparatorEnd: ' + err))
  } catch (err) {
    // fastify.log.error(err)
    log.e(mod, 'exitServer', err)
    log.sysAlert(`Server exited anormally: ${err}`, 'rudiServer.starting', {}, { error: err })
    process.exit(1)
  }
}
