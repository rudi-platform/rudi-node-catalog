const mod = 'catalog.app'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { API_VERSION } from './config/constApi.js'

// 1. Utils
import { beautify, consoleErr, consoleLog, separateLogs } from './utils/jsUtils.js'

// 2. Sys conf
import {
  getAppName,
  getCatalog,
  getDbFullUri,
  getServerAddress,
  getServerPort,
} from './config/confSystem.js'

// 3. Log conf
import './config/confLogs.js'

// 4. Anything, now

// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import mongoose from 'mongoose'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { getLicenceCodes } from './controllers/licenceController.js'
import { getAppHash, getEnvironment } from './controllers/sysController.js'
import { Contact } from './definitions/models/Contact.js'
import { LogEntry } from './definitions/models/LogEntry.js'
import { Media } from './definitions/models/Media.js'
import { Metadata } from './definitions/models/Metadata.js'
import { Organization } from './definitions/models/Organization.js'
import Keywords from './definitions/thesaurus/Keywords.js'
import Themes from './definitions/thesaurus/Themes.js'
import { launchRouteListener, shutDownListener } from './routes/fastify.js'
import { addLogEntry, logE, logI, logT, logW, sysAlert, sysCrit, sysInfo } from './utils/logging.js'

import './config/confPortal.js'
import { RudiError } from './utils/errors.js'

// -------------------------------------------------------------------------------------------------
// Prerequisites
// -------------------------------------------------------------------------------------------------
// Fixing Regexp display as a string
RegExp.prototype.toJSON = RegExp.prototype.toString // NOSONAR

// -------------------------------------------------------------------------------------------------
// External dependencies / init
// -------------------------------------------------------------------------------------------------
// Require external modules

// Import Swagger Options
// import swagger from './config/swagger'

// Register Swagger
// fastify.register(require('fastify-swagger'), swagger.options)

// -------------------------------------------------------------------------------------------------
// DB connection
// -------------------------------------------------------------------------------------------------

// Setting flags to avoid deprecation warnings
const mongoConnect = async () => {
  const fun = 'mongoConnect'
  mongoose.set('strictQuery', false)
  consoleLog(mod, fun, `Connecting to MongoDB`)

  await mongoConnectWithRetry()
  logI(mod, fun, `MongoDB connected`)
}
const MAX_DB_CONNECT_RETRIES = 5
let currentRetry = 0

const mongoConnectWithRetry = async () => {
  const fun = 'mongoConnectWithRetry'
  try {
    await mongoose.connect(getDbFullUri())
  } catch (err) {
    logW(mod, fun, `Database connection failed, retrying... ${err}`)
    currentRetry++
    if (currentRetry <= MAX_DB_CONNECT_RETRIES) {
      // Wait 5 seconds before retryingut
      setTimeout(() => mongoConnectWithRetry(), 5000)
    } else {
      logE(mod, fun, `Failed to connect to database after ${MAX_DB_CONNECT_RETRIES}retries: ${err}`)
      sysCrit(`Mongo connection: ${err}`, 'rudiServer.dbConnect', {}, { error: err })
      throw new RudiError('Could not connect to MongoDB')
    }
  }
}

const closeMongoConnection = async (signal) => {
  const mod = 'mongoDB'
  const fun = 'close'
  logI(mod, fun, `Received signal to shutdown: ${signal}`, false)
  try {
    await mongoose.connection.close(false)
    logI(mod, `${fun}.${signal}`, 'OK', false)
  } catch (e) {
    logE(mod, `${fun}.${signal}.err`, e, false)
  }

  setTimeout(() => {
    logE(mod, fun, 'Could not close connections in time, forcefully shutting down', false)
    mongoose.connection.close(true)
  }, 5000)
}

const initializeModelIndexes = async () => {
  try {
    await Promise.all(
      [LogEntry, Contact, Organization, Media, Metadata].map(
        (model) =>
          new Promise((resolve, reject) => {
            model
              .initialize()
              .then((res) => {
                logT(mod, `Init model ${model?.collection?.name}`, res)
                resolve(res)
              })
              .catch((err) => {
                logE(mod, `Init model ${model?.collection?.name}`, err)
                reject(err)
              })
          })
      )
    )
  } catch (err) {
    logE(mod, 'initializeModelIndexes', err)
    throw new Error(`Model index initialization failed: ${err}`)
  }
}

// -------------------------------------------------------------------------------------------------
// SERVER
// -------------------------------------------------------------------------------------------------
const start = async () => {
  const fun = 'start'
  try {
    separateLogs('Connecting to MongoDB', true) ////////////////////////////////////////////////////
    await mongoConnect()

    separateLogs('Handling rejections', true) //////////////////////////////////////////////////////
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
      logE(mod, fun, 'The error was: ' + beautify(err))
      sysCrit(
        `Promise rejection not handled: ${beautify(promise)})`,
        'rudiServer.promiseUnhandled',
        {},
        {
          promise: beautify(promise),
        }
      )
      sysCrit(`Promise rejection error: ${beautify(err)}`, 'rudiServer.on', {}, { error: err })
    })

    separateLogs('Routes listener', true) //////////////////////////////////////////////////////////
    await launchRouteListener()

    process.on('SIGINT', () => shutDown('SIGINT'))
    process.on('SIGQUIT', () => shutDown('SIGQUIT'))
    process.on('SIGTERM', () => shutDown('SIGTERM'))

    separateLogs('Indexing models', true) //////////////////////////////////////////////////////////
    await initializeModelIndexes()

    separateLogs('Thesauri init', true) ////////////////////////////////////////////////////////////
    await Keywords.initialize()
    await Themes.initialize()
    await getLicenceCodes()

    separateLogs('Start', true) ////////////////////////////////////////////////////////////////////
    const startMsg = `API v${API_VERSION} | App version: '${getAppHash()}' | '${getEnvironment()}' env`
    logI(mod, fun, startMsg)
    sysInfo(startMsg, '', '', ' ')
    logI(
      mod,
      'server',
      `Ready, listening on ${getServerAddress()}:${getServerPort()}${getCatalog()}`
    )

    const logSeparatorEnd = separateLogs('Init OK', true) //////////////////////////////////////////

    addLogEntry('info', 'app', 'logSeparatorEnd', logSeparatorEnd).catch((err) =>
      consoleErr('info', 'app', 'logSeparatorEnd: ' + err)
    )
  } catch (err) {
    // fastify.error(err)
    logE(mod, 'exitServer', err)
    sysAlert(`Server exited anormally: ${err}`, 'rudiServer.starting', {}, { error: err })
    shutDown('SIGKILL')
  }
}

async function shutDown(signal) {
  const fun = 'shutDown'
  try {
    await closeMongoConnection(signal)
    await shutDownListener(signal)
    process.exit(0)
  } catch (e) {
    logE(mod, `${fun}.${signal}`, `An error occurred while shutting down: ${e}`, false)
    process.exit(1)
  }
}
// -------------------------------------------------------------------------------------------------
// RUN SERVER
// -------------------------------------------------------------------------------------------------
export const runRudiCatalog = () =>
  start().catch((err) => {
    logE(mod, 'server', `Crashed: ${err}`)
    sysCrit(`Server crashed: ${err}`, 'rudiServer.running', {}, { error: err })
    process.exit(1)
  })
