//———————————————————————————————————————————————————————————————
// LIBRARIES 
//———————————————————————————————————————————————————————————————

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
// DB connection
//———————————————————————————————————————————————————————————————

// Connect to DB
/*
const user = "rudiuser"
const pass = "rQgzqcMORG9Owkl0z"
const dbUrl = "rudi.kzlag.mongodb.net"
//const url = `mongodb+srv://${user}:${pass}@${dbUrl}/${dbName}?retryWrites=true&w=majority`
*/
const dbName = "rudi_prod" 
const dbPort = 27017
const url = `mongodb://127.0.0.1/${dbName}:${dbPort}`
const mongoConnectOptions = { useUnifiedTopology: true, useNewUrlParser: true }

console.log(`-- Connecting to [${url}]`)
const promise = mongoose.connect(url, mongoConnectOptions)
  .then(() => console.log('-- MongoDB connected'))
  .catch(err => console.log(err))
// console.log("-- connection ok")


//———————————————————————————————————————————————————————————————
// ROUTES 
//———————————————————————————————————————————————————————————————

// Import Routes
const routes = require('./routes')

 // Declare a default route
 fastify.get('/', async (request, reply) => {
  console.log("-- hello")
  return { hello: "world" }
})

// Loop over each route  
routes.forEach((route, index) => {
  fastify.route(route) 
  // console.log(`-- route ${index}: ${route}`)
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

