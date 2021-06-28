'use strict'

const mod = 'main'

// -----------------------------------------------------------------------------
// Internal dependancies
// -----------------------------------------------------------------------------
const utils = require('./utils/jsUtils')
const sys = require('./config/confSystem')
const logConf = require('./config/confLogs')
const log = require('./utils/logging')
// const portal = require('./config/confPortal')

const api = require('./config/confApi')
const sysController = require('./controllers/sysController')

// -----------------------------------------------------------------------------
// Prerequisites
// -----------------------------------------------------------------------------
// Fixing Regexp display as a string
RegExp.prototype.toJSON = RegExp.prototype.toString

// -----------------------------------------------------------------------------
// External dependancies / init
// -----------------------------------------------------------------------------
// Require external modules
const mongoose = require('mongoose')

// Require the fastify framework and instantiate it
const fastify = require('fastify')({
  logger: {
    level: 'warn',
    logger: logConf.initFFLogger('rudiProxi'),
    // file: sys.OUT_LOG
  },
})
fastify.addHook('onRequest', (req, res, next) => {
  log.logRequest(req)
  next()
})

// fastify.setErrorHandler(function (error, request, reply) {
//   log.e(mod, 'fastifyErrorHandler', error)
// })

// Import Swagger Options
const swagger = require('./config/swagger')

// Register Swagger
fastify.register(require('fastify-swagger'), swagger.options)

// -----------------------------------------------------------------------------
// DB connection
// -----------------------------------------------------------------------------

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

log.i(mod, 'mongo', `Connecting to [${sys.DB_URL}]`)
const mongoConnection = mongoose.connect(sys.DB_URL, mongoConnectOptions)

// -----------------------------------------------------------------------------
// ROUTES
// -----------------------------------------------------------------------------

// Import Routes
const { publicRoutes, backOfficeRoutes, devRoutes } = require('./routes/routes')

// Declare a default route
fastify.get('/', async (request, reply) => {
  log.i(mod, 'routes', 'GET /')
  return {
    server: 'RUDI',
  }
})

// Declare a default route
fastify.get('/api', async (request, reply) => {
  // request.log.info(`GET /api`)
  log.i(mod, 'routes', 'GET /api')
  return {
    API: 'RUDI API',
  }
})

// Declare a default route
fastify.get(api.URL_PREFIX_PUBLIC, async (request, reply) => {
  log.i(mod, 'routes', `GET ${api.URL_PREFIX_PUBLIC}`)
  return {
    'API version': 'RUDI API v1',
  }
})
fastify.get(`${api.URL_PREFIX_PUBLIC}/`, async (request, reply) => {
  log.i(mod, 'routes', `GET ${api.URL_PREFIX_PUBLIC}/`)
  return {
    'API version': 'RUDI API v1',
  }
})

// Loop over each public route
publicRoutes.forEach((pubRoute, index) => {
  fastify.route(pubRoute)
  log.v(mod, 'routes', `route #${index} = ${pubRoute.method} ${pubRoute.url}`)
})

// Loop over each backoffice route
backOfficeRoutes.forEach((boRoute, index) => {
  fastify.route(boRoute)
  // log.d(mod, 'routes', `route #${index} = ${boRoute.method} ${boRoute.url}`)
})

devRoutes.forEach((rouge, index) => {
  fastify.route(rouge)
})

// -----------------------------------------------------------------------------
// SERVER
// -----------------------------------------------------------------------------
const start = async () => {
  try {
    await fastify
      .listen(sys.LISTENING_PORT, sys.LISTENING_ADDR)
      .catch((err) => log.e(mod, 'Fastify listen', `${err}`))
    fastify.swagger()
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

mongoConnection
  .then(() => {
    log.i(mod, 'mongo', 'MongoDB connected')
    log.i(mod, 'app', `Application version '${sysController.getAppHash()}' | API ${api.VERSION}`)

    utils.separateLogs('Init OK')
  })
  .catch((err) => log.e(mod, 'mongoConnection', err))

process.on('uncaughtException', (err) => {
  log.e(mod, 'process', `Uncaught error: ${err}`)
  // console.error('There was an uncaught error', err)
  // process.exit(1) //mandatory (as per the Node.js docs)
})

process.on('unhandledRejection', (error, promise) => {
  const fun = 'catching promise rejection'
  log.e(mod, fun, 'DAMN!!! Promise rejection not handled here: ', promise)
  log.e(mod, fun, 'The error was: ', error)
})
