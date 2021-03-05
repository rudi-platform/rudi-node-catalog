//———————————————————————————————————————————————————————————————
// LIBRARIES 
//———————————————————————————————————————————————————————————————
const log = require('./utils/logging')
const fName = 'main'

// Require the fastify framework and instantiate it
const fastify = require('fastify')({
  logger: true
})

// Require external modules
const mongoose = require('mongoose')


// Import Swagger Options
const swagger = require('./config/swagger')

// Register Swagger
fastify.register(require('fastify-swagger'), swagger.options)

//———————————————————————————————————————————————————————————————
// Constants 
//———————————————————————————————————————————————————————————————
const {
  URL_PREFIX,
} = require('./config/confApi')

const {
  DB_NAME,
  DB_PORT,
  DB_URL,
} = require('./config/confSystem')

//———————————————————————————————————————————————————————————————
// DB connection
//———————————————————————————————————————————————————————————————

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

log.d(fName, `Connecting to [${DB_URL}]`)
const promise = mongoose.connect(DB_URL, mongoConnectOptions)
  .then(() => log.d(fName, 'MongoDB connected'))
  .catch(err => log.d(fName, err))
// log.d(fName, "connection ok")


//———————————————————————————————————————————————————————————————
// ROUTES 
//———————————————————————————————————————————————————————————————

// Import Routes
const routes = require('./routes')

// Declare a default route
fastify.get('/', async (request, reply) => {
  log.d(fName, "hello")
  return {
    server: "RUDI"
  }
})
// Declare a default route
fastify.get('/api', async (request, reply) => {
  log.d(fName, "api")
  return {
    API: "RUDI API"
  }
})
// Declare a default route
fastify.get(URL_PREFIX, async (request, reply) => {
  log.d(fName, URL_PREFIX)
  return {
    'API version': "RUDI API v1"
  }
})

// Loop over each route  
routes.forEach((route, index) => {
  fastify.route(route)
  log.d(fName, `route #${index} = ${route.method} ${route.url}`)
})

//———————————————————————————————————————————————————————————————
// SERVER 
//———————————————————————————————————————————————————————————————
const start = async () => {
  try {
    await fastify.listen(3000)
    fastify.swagger()
    // fastify.log.info(`Listening on ${fastify.server.address().address}:${fastify.server.address().port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()