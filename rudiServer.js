'use strict'

const mod = 'main'

const APP_TITLE = 'rudiprod.api'

// ------------------------------------------------------------------------------------------------
// Internal dependancies
// ------------------------------------------------------------------------------------------------
const utils = require('./utils/jsUtils')
const sys = require('./config/confSystem')
const logConf = require('./config/confLogs')
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
const { createRudiHttpError } = require('./utils/errors')

// Require the fastify framework and instantiate it
const fastify = require('fastify')({
  logger: {
    level: 'warn',
    logger: logConf.initFFLogger(sys.APP_NAME),
    // file: sys.OUT_LOG
  },
  ignoreTrailingSlash: true,
})

fastify.setErrorHandler((error, request, reply) => {
  const fun = 'setErrorHandler'
  try {
    log.e(mod, fun, error)
    const rudiHttpError = createRudiHttpError(error.statusCode, error.message)
    reply.code(rudiHttpError.statusCode).send(rudiHttpError)
  } catch (uncaughtErr) {
    log.w(mod, fun, uncaughtErr)
  }
  log.d(mod, fun, 'done')
})

fastify.decorate('notFound', (req, reply) => {
  const fun = 'notFound'
  const ip = req.ip

  const response = {
    message: `Route ${req.method}:${req.url} not found`,
    error: 'Not Found',
    statusCode: 404,
  }

  log.w(mod, fun, `${response.message} <- ${utils.displayIps(req)}`)

  // log.d(mod, fun, utils.beautify(req))
  reply.code(404).send(response)
})

fastify.setNotFoundHandler(fastify.notFound)

fastify.addHook('onRequest', (req, res, next) => {
  log.logRequest(req)
  next()
})
fastify.addHook('onError', (request, reply, error, done) => {
  const fun = 'onError'
  log.e(mod, fun, error)
  done()
})
// Import Swagger Options
// const swagger = require('./config/swagger')

// Register Swagger
// fastify.register(require('fastify-swagger'), swagger.options)

// ------------------------------------------------------------------------------------------------
// DB connection
// ------------------------------------------------------------------------------------------------

// Setting flags to avoid deprecation warnings
mongoose.set('useFindAndModify', false)

// Connect to DB
/*
const user = "rudiuser"
const pass = "rQgzqcMORG9Owkl0z"
const dbUrl = "rudi.kzlag.mongodb.net"
//const url = `mongodb+srv://${user}:${pass}@${dbUrl}/${dbName}?retryWrites=true&w=majority`
*/
const mongoConnectOptions = {
  useUnifiedTopology: true,
  useCreateIndex: true,
  useNewUrlParser: true,
}

const logSeparatorConf =
  '---------------------------------------------------------------[Conf OK]--'
console.log(utils.nowLocaleFormatted(), logSeparatorConf)
addLogEntry('info', 'app', 'logSeparatorConf', logSeparatorConf).catch((err) =>
  utils.consoleErr('info', 'app', 'logSeparatorConf: ' + err)
)

log.i(mod, 'mongo', `Connecting to [${sys.DB_URL}]`)
mongoose
  .connect(sys.DB_URL, mongoConnectOptions)
  .then(() => {
    log.i(mod, 'mongo', `MongoDB connected`)
    log.i(
      mod,
      'app',
      `API v${
        api.VERSION
      } | App version: '${sysController.getAppHash()}' | '${sysController.getEnvironment()}' env`
    )
    const logSeparatorEnd = utils.separateLogs('Init OK')
    addLogEntry('info', 'app', 'logSeparatorEnd', logSeparatorEnd).catch((err) =>
      utils.consoleErr('info', 'app', 'logSeparatorEnd: ' + err)
    )
  })
  .catch((err) => log.e(mod, 'mongoConnection', err))

// ------------------------------------------------------------------------------------------------
// ROUTES
// ------------------------------------------------------------------------------------------------

// Import Routes
const { publicRoutes, backOfficeRoutes, devRoutes, redirectRoutes } = require('./routes/routes')

// Loop over each public route
redirectRoutes.forEach((pubRoute, index) => {
  fastify.route(pubRoute)
  log.v(mod, 'routes', `Redirect route #${index} = ${pubRoute.method} ${pubRoute.url}`)
})
// Loop over each public route
publicRoutes.forEach((pubRoute, index) => {
  fastify.route(pubRoute)
  log.i(mod, 'routes', `Public route #${index} = ${pubRoute.method} ${pubRoute.url}`)
})

// Loop over each backoffice route
backOfficeRoutes.forEach((boRoute, index) => {
  fastify.route(boRoute)
  log.v(mod, 'routes', `Private route #${index} = ${boRoute.method} ${boRoute.url}`)
})

devRoutes.forEach((devRoute, index) => {
  fastify.route(devRoute)
  log.d(mod, 'routes', `Dev route #${index} = ${devRoute.method} ${devRoute.url}`)
})

// ------------------------------------------------------------------------------------------------
// SERVER
// ------------------------------------------------------------------------------------------------
const start = async () => {
  try {
    process.title = APP_TITLE
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
