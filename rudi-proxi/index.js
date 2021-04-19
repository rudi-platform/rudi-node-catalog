'use strict';

const mod = ''
const fun = 'main'

//---------------------------------------------------------------
// Internal dependancies 
//---------------------------------------------------------------
const utils = require('./utils/jsUtils')
const sys = require('./config/confSystem')
const logConf = require('./config/confLogs')
const log = require('./utils/logging')

const api = require('./config/confApi')

//---------------------------------------------------------------
// External dependancies / init
//---------------------------------------------------------------
// Require external modules
const mongoose = require('mongoose')

// Require the fastify framework and instantiate it
const fastify = require('fastify')({
  logger: {
    level: 'warn',
    logger: logConf.initFFLogger("rudiProxi")
    // file: sys.OUT_LOG
  }
})
fastify.addHook('onRequest', (req, res, next) => {
  log.logRequest(req)
  next()
})

// Import Swagger Options
const swagger = require('./config/swagger')

// Register Swagger
fastify.register(require('fastify-swagger'), swagger.options)

//---------------------------------------------------------------
// DB connection
//---------------------------------------------------------------

// Setting flags to avoid deprecation warnings
mongoose.set('useFindAndModify', false);

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
  useNewUrlParser: true
}

log.i(mod, fun, `Connecting to [${sys.DB_URL}]`)
const mongoConnection = mongoose.connect(sys.DB_URL, mongoConnectOptions)


//---------------------------------------------------------------
// ROUTES 
//---------------------------------------------------------------

// Import Routes
const {
  publicRoutes,
  backOfficeRoutes,
  inspectRequest
} = require('./routes/routes');
const {
  initFFLogger
} = require('./config/confLogs');
const {
  consoleErr
} = require('./utils/jsUtils');

// Declare a default route
fastify.get('/', async (request, reply) => {
  log.i(mod, fun, "GET /")
  return {
    server: "RUDI"
  }
})
// Declare a default route
fastify.get('/api', async (request, reply) => {
  // request.log.info(`GET /api`)
  log.i(mod, fun, "GET /api")
  return {
    API: "RUDI API"
  }
})
// Declare a default route
// Declare a default route
fastify.get(api.URL_PREFIX_PUBLIC, async (request, reply) => {
  log.i(mod, fun, `GET ${api.URL_PREFIX_PUBLIC}`)
  return {
    'API version': "RUDI API v1"
  }
})
fastify.get(`${api.URL_PREFIX_PUBLIC}/`, async (request, reply) => {
  log.i(mod, fun, `GET ${api.URL_PREFIX_PUBLIC}/`)
  return {
    'API version': "RUDI API v1"
  }
})
// Loop over each public route  
publicRoutes.forEach((pubRoute, index) => {
  fastify.route(pubRoute)
  log.v(mod, fun, `route #${index} = ${pubRoute.method} ${pubRoute.url}`)
})

// Loop over each backoffice route  
backOfficeRoutes.forEach((boRoute, index) => {
  fastify.route(boRoute)
  log.d(mod, fun, `route #${index} = ${boRoute.method} ${boRoute.url}`)
})



//---------------------------------------------------------------
// SERVER 
//---------------------------------------------------------------
const start = async () => {
  try {
    await fastify.listen(sys.LISTENING_PORT, sys.LISTENING_ADDR)
    fastify.swagger()
    // fastify.log.info(`Listening on ${fastify.server.address().address}:${fastify.server.address().port}`)
  } catch (err) {
    // fastify.log.error(err)
    log.e(mod, 'startServer', err)
    process.exit(1)
  }
}

start()

mongoConnection
  .then(() => {
    log.i(mod, fun, 'MongoDB connected')
    utils.separateLogs('Init OK')
  })
  .catch(err => log.e(mod, 'mongoConnection', err))
