const mod = 'main'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { API_VERSION } from './config/confApi.mjs'

// 1. Utils
import { separateLogs, beautify, consoleErr, consoleLog } from './utils/jsUtils.mjs'
separateLogs('Loading conf', true) ///////////////////////////////////////////////////////////

// 2. Sys conf
import { getAppName, getDbUrl, getServerAddress, getServerPort } from './config/confSystem.mjs'

// 3. Log conf
import './config/confLogs.mjs'

// 4. Anything, now

// -------------------------------------------------------------------------------------------------
// Prerequisites
// -------------------------------------------------------------------------------------------------
// Fixing Regexp display as a string
RegExp.prototype.toJSON = RegExp.prototype.toString

// -------------------------------------------------------------------------------------------------
// External dependencies / init
// -------------------------------------------------------------------------------------------------
// Require external modules
separateLogs('Connecting to DB', true) ///////////////////////////////////////////////////////

import mongoose from 'mongoose'

// Import Swagger Options
// import swagger from './config/swagger'

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

import { getAppHash, getEnvironment } from './controllers/sysController.mjs'
import { addLogEntry, logE, logI, sysAlert, sysCrit, sysInfo } from './utils/logging.mjs'

consoleLog(mod, 'mongo', `Connecting to [${getDbUrl()}]`)

// import { fastifyConf, declareRoutes } from './routes/fastify'
import { LogEntry } from './definitions/models/LogEntry.mjs'
import { Contact } from './definitions/models/Contact.mjs'
import { Organization } from './definitions/models/Organization.mjs'
import { Media } from './definitions/models/Media.mjs'
import { Metadata } from './definitions/models/Metadata.mjs'
import Keywords from './definitions/thesaurus/Keywords.mjs'
import Themes from './definitions/thesaurus/Themes.mjs'
import { fastifyConf, declareRoutes } from './routes/fastify.mjs'

mongoose
  .connect(getDbUrl())
  .then(() => {
    logI(mod, 'mongo', `MongoDB connected`)

    try {
      start().catch((err) => {
        logE(mod, 'server', `Crashed: ${err}`)
        sysCrit(`Server crashed: ${err}`, 'rudiServer.running', {}, { error: err })
      })
    } catch (err) {
      logE(mod, 'server', `Uncaught error: ${err}`)
      sysCrit(`Uncaught error: ${err}`, 'rudiServer.uncaughtError', {}, { error: err })
    }
  })
  .catch((err) => {
    logE(mod, 'mongoConnection', err)
    sysCrit(`Mongo connection: ${err}`, 'rudiServer.dbConnect', {}, { error: err })
    process.exit(1)
    // throw RudiError.treatError(mod, 'mongoConnection', err)
  })

// -------------------------------------------------------------------------------------------------
// SERVER
// -------------------------------------------------------------------------------------------------
const start = async () => {
  const fun = 'start'
  try {
    separateLogs('Handling rejections', true) ////////////////////////////////////////////////

    process.title = getAppName()

    process.on('uncaughtException', (err) => {
      logE(mod, 'process', `Uncaught exception: ${err}`)
      sysCrit(`Uncaught exception: ${err}`, 'rudiServer.uncaughtException', {}, { error: err })
      // console.error('There was an uncaught error', err)
      // process.exit(1) //mandatory (as per the Node.js docs)
    })

    process.on('unhandledRejection', (err, promise) => {
      const fun = 'catching promise rejection'
      logE(mod, fun, 'DAMN!!! Promise rejection not handled here: ' + beautify(promise))
      logE(mod, fun, 'The error was: ' + err)
      sysCrit(
        `Promise rejection not handled: ${beautify(promise)})`,
        'rudiServer.promiseUnhandled',
        {},
        {
          promise: beautify(promise),
        }
      )
      sysCrit(`Promise rejection error: ${err}`, 'rudiServer.on', {}, { error: err })
    })

    separateLogs('Portal conf', true) ////////////////////////////////////////////////////////
    import('./config/confPortal.mjs')

    separateLogs('Routes', true) /////////////////////////////////////////////////////////////

    await fastifyConf
      .listen(getServerPort(), getServerAddress())
      .catch((err) => logE(mod, 'Fastify listen', `${err}`))
    // fastify.swagger()
    // fastify.info(`Listening on ${fastify.server.address().address}:${fastify.server.address().port}`)
    declareRoutes()
    separateLogs('Models', true) /////////////////////////////////////////////////////////////

    await Promise.all(
      [LogEntry, Contact, Organization, Media, Metadata, Keywords, Themes].map((model) =>
        model.initialize()
      )
    )

    separateLogs('Start', true) //////////////////////////////////////////////////////////////
    const appVer = getAppHash()
    const curEnv = getEnvironment()
    const startMsg = `API v${API_VERSION} ` + `| App version: '${appVer}' ` + `| '${curEnv}' env`
    logI(mod, fun, startMsg)
    sysInfo(startMsg, '', '', ' ')
    logI(mod, 'server', 'Ready')

    const logSeparatorEnd = separateLogs('Init OK', true) //////////////////////////////////////////

    addLogEntry('info', 'app', 'logSeparatorEnd', logSeparatorEnd).catch((err) =>
      consoleErr('info', 'app', 'logSeparatorEnd: ' + err)
    )
  } catch (err) {
    // fastify.error(err)
    logE(mod, 'exitServer', err)
    sysAlert(`Server exited anormally: ${err}`, 'rudiServer.starting', {}, { error: err })
    process.exit(1)
  }
}
