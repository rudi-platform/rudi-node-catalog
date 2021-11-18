'use strict'

const mod = 'fastify'

// ------------------------------------------------------------------------------------------------
// Internal dependancies
// ------------------------------------------------------------------------------------------------
const utils = require('../utils/jsUtils')
const { initFFLogger, shouldShowErrorPile } = require('../config/confLogs')
const log = require('../utils/logging')
const { createRudiHttpError, isRudiHttpError } = require('../utils/errors')
const { CallContext } = require('../definitions/constructors/callContext')

// ------------------------------------------------------------------------------------------------
// External dependancies
// ------------------------------------------------------------------------------------------------
// Require the fastify framework and instantiate it
const fastify = require('fastify')({
  logger: {
    level: 'warn',
    logger: initFFLogger(),
    // file: sys.OUT_LOG
  },
  ignoreTrailingSlash: true,
})

// ------------------------------------------------------------------------------------------------
// Fastify init
// ------------------------------------------------------------------------------------------------
fastify.setErrorHandler((error, request, reply) => {
  const fun = 'finalErrorHandler'
  log.t(mod, fun, ``)
  try {
    // log.d(mod, fun, isRudiHttpError(error))
    let rudiHttpError
    if (isRudiHttpError(error)) rudiHttpError = error
    else {
      const code = error.statusCode
      const msg = error.message
      rudiHttpError = createRudiHttpError(code, msg)
    }
    reply.code(rudiHttpError.statusCode).send(rudiHttpError)
    // log.sysError(`Error ${rudiHttpError.statusCode}: ${rudiHttpError.message}`)
  } catch (uncaughtErr) {
    log.e(mod, fun, `Uncaught! ${uncaughtErr}`)
    log.sysCrit(`Uncaught error: ${uncaughtErr}`, { error: uncaughtErr })
  }
  log.t(mod, fun, 'done')
})

fastify.decorate('notFound', (req, reply) => {
  const fun = 'notFound'
  // const ip = req.ip

  const response = {
    message: `Route '${req.method} ${req.url}' not found`,
    error: 'Not Found',
    statusCode: 404,
  }

  log.w(mod, fun, `${response.message} <- ${utils.getIpsMsg(req)}`)
  log.sysNotice(`Error 404: ${response.message}`, CallContext.getContextFromReq(req))
  // log.d(mod, fun, utils.beautify(req))
  reply.code(404).send(response)
})

fastify.setNotFoundHandler(fastify.notFound)

fastify.addHook('onRequest', (req, res, next) => {
  log.v('http', 'apiCall', utils.getApiCallMsg(req))
  next()
})

fastify.addHook('onError', (request, reply, error, done) => {
  const fun = 'onError'
  try {
    log.d(mod, fun, ``)
    if (isRudiHttpError(error)) {
      if (shouldShowErrorPile()) error.logErrorPile()

      log.sysError(
        `Error ${error.statusCode} (${error.name}): ${error.message}`,
        CallContext.getContextFromReq(request)
      )
    } else {
      log.sysError(error, CallContext.getContextFromReq(request))
    }
  } catch (err) {
    log.e(mod, fun, err)
  }
  done()
})

fastify.addHook('onSend', (_request, reply, payload, next) => {
  // const fun = 'onSend'
  // log.d(mod, fun, utils.beautify(payload))
  next()
})

// ------------------------------------------------------------------------------------------------
// ROUTES
// ------------------------------------------------------------------------------------------------

// Import Routes
const { publicRoutes, backOfficeRoutes, devRoutes, redirectRoutes } = require('./routes')

// Loop over each public route
redirectRoutes.forEach((pubRoute, index) => {
  fastify.route(pubRoute)
  log.v('Redirect', 'routes', `${utils.padA1(index)}: ${pubRoute.method} ${pubRoute.url}`)
})
// Loop over each public route
publicRoutes.forEach((pubRoute, index) => {
  fastify.route(pubRoute)
  log.i('Public', 'routes', `${utils.padA1(index)}: ${pubRoute.method} ${pubRoute.url}`)
})

// Loop over each backoffice route
backOfficeRoutes.forEach((boRoute, index) => {
  fastify.route(boRoute)
  log.v('Private', 'routes', `${utils.padA1(index)}: ${boRoute.method} ${boRoute.url}`)
})

devRoutes.forEach((devRoute, index) => {
  fastify.route(devRoute)
  log.d('Dev', 'routes', `${utils.padA1(index)}: ${devRoute.method} ${devRoute.url}`)
})

// ------------------------------------------------------------------------------------------------
// Exports
// ------------------------------------------------------------------------------------------------

module.exports = fastify
