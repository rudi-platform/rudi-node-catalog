'use strict'

const mod = 'fastify'

// ------------------------------------------------------------------------------------------------
// Internal dependancies
// ------------------------------------------------------------------------------------------------
const utils = require('../utils/jsUtils')
const { initFFLogger, shouldShowErrorPile, shouldShowRoutes } = require('../config/confLogs')
const log = require('../utils/logging')
const { RudiError } = require('../utils/errors')

const { STATUS_CODE, ROUTE_NAME } = require('../config/confApi')
const { CallContext } = require('../definitions/constructors/callContext')

const { publicRoutes, backOfficeRoutes, devRoutes, redirectRoutes } = require('./routes')

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
// Cosntants
// ------------------------------------------------------------------------------------------------

// ------------------------------------------------------------------------------------------------
// Fastify hooks: errors
// ------------------------------------------------------------------------------------------------
fastify.addHook('onError', (request, reply, error, done) => {
  const fun = 'onError'
  log.t(mod, fun, ``)
  try {
    // log.d(mod, fun, `isRudiError: ${RudiError.isRudiError(error)}`)
    // log.d(mod, fun, `showErrorPile: ${shouldShowErrorPile()}`)

    const reqContext = CallContext.getCallContextFromReq(request)
    // if (reqContext) log.d(mod, fun, `request: ${utils.beautify(reqContext)}`)

    if (RudiError.isRudiError(error) && shouldShowErrorPile()) RudiError.logErrorPile(error)

    reqContext.logErr(mod, fun, error)
    reply.isError = true
  } catch (err) {
    log.e(mod, fun, err)
    const context = CallContext.getCallContextFromReq(request)
    context.logErr(mod, fun, err)
    throw context.getError()
  }
  done()
})

fastify.setErrorHandler((error, request, reply) => {
  const fun = 'finalErrorHandler'
  log.t(mod, fun, ``)
  try {
    // log.d(mod, fun, RudiError.isRudiError(error))
    let rudiHttpError
    if (RudiError.isRudiError(error)) rudiHttpError = error
    else {
      rudiHttpError = RudiError.createRudiHttpError(error.statusCode, error.message || error)
    }
    reply.isError = true
    reply.code(rudiHttpError[STATUS_CODE]).send(rudiHttpError)
    // log.sysError(`Error ${rudiHttpError.statusCode}: ${rudiHttpError.message}`)
  } catch (uncaughtErr) {
    log.e(mod, fun, `Uncaught! ${uncaughtErr}`)
    log.sysCrit(
      `Uncaught error: ${uncaughtErr}`,
      'ff.errorHandler',
      CallContext.getReqContext(request),
      {
        error: uncaughtErr,
      }
    )
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
  log.sysNotice(`Error 404: ${response.message}`, CallContext.getReqContext(req))
  // log.d(mod, fun, utils.beautify(req))
  reply.isError = true
  reply.code(404).send(response)
})

fastify.setNotFoundHandler(fastify.notFound)

// ------------------------------------------------------------------------------------------------
// Fastify hooks: request receive / send
// ------------------------------------------------------------------------------------------------
fastify.addHook('onRequest', (req, res, next) => {
  const fun = 'onRequest'
  try {
    const context = new CallContext()
    log.t(mod, fun, `----- Rcv req #${context.id} -----vvv---`)
    const now = utils.nowEpochMs()

    context.setIpsFromRequest(req)
    context.setReqDescription(req.method, req.url, req.context.config[ROUTE_NAME])
    context.timestamp = now
    CallContext.setAsReqContext(req, context)

    log.t('http', fun, CallContext.createApiCallMsg(req))
    next()
  } catch (err) {
    log.e(mod, fun, err)
  }
})

fastify.addHook('onSend', (request, reply, payload, next) => {
  const fun = 'onSend'
  try {
    log.t(mod, fun, ``)
    const now = utils.nowEpochMs()

    const context = CallContext.getCallContextFromReq(request)
    context.duration = now - context.timestamp
    context.statusCode = reply.statusCode

    if (!reply.isError) context.logInfo(mod, fun, 'API reply')
    log.t(mod, fun, `----- Send reply #${context.id} (${context.duration} ms) -----^^^--`)
    next()
  } catch (err) {
    log.e(mod, fun, err)
  }
})

// ------------------------------------------------------------------------------------------------
// ROUTES
// ------------------------------------------------------------------------------------------------

// Loop over each public route
redirectRoutes.forEach((pubRoute, index) => {
  fastify.route(pubRoute)
  if (shouldShowRoutes())
    log.v('Redirect', 'routes', `${utils.padA1(index)}: ${pubRoute.method} ${pubRoute.url}`)
})
// Loop over each public route
publicRoutes.forEach((pubRoute, index) => {
  fastify.route(pubRoute)
  if (shouldShowRoutes())
    log.i('Public', 'routes', `${utils.padA1(index)}: ${pubRoute.method} ${pubRoute.url}`)
})

// Loop over each backoffice route
backOfficeRoutes.forEach((boRoute, index) => {
  fastify.route(boRoute)
  if (shouldShowRoutes())
    log.v('Private', 'routes', `${utils.padA1(index)}: ${boRoute.method} ${boRoute.url}`)
})

devRoutes.forEach((devRoute, index) => {
  fastify.route(devRoute)
  if (shouldShowRoutes())
    log.d('Dev', 'routes', `${utils.padA1(index)}: ${devRoute.method} ${devRoute.url}`)
})

// ------------------------------------------------------------------------------------------------
// Exports
// ------------------------------------------------------------------------------------------------

module.exports = fastify
