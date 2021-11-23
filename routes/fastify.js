'use strict'

const mod = 'fastify'

// ------------------------------------------------------------------------------------------------
// Internal dependancies
// ------------------------------------------------------------------------------------------------
const utils = require('../utils/jsUtils')
const { initFFLogger, shouldShowErrorPile } = require('../config/confLogs')
const log = require('../utils/logging')
const { RudiError } = require('../utils/errors')
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
// Cosntants
// ------------------------------------------------------------------------------------------------
const TRACE_TIME = 'traceTiming'
const REQ_DURATION = 'reqTimeMs'

// ------------------------------------------------------------------------------------------------
// Fastify hooks: errors
// ------------------------------------------------------------------------------------------------
fastify.addHook('onError', (request, reply, error, done) => {
  const fun = 'onError'
  log.d(mod, fun, ``)
  try {
    const reqContext = CallContext.getCallContextFromReq(request)
    if (reqContext) log.d(mod, fun, `request: ${utils.beautify(reqContext)}`)
    reqContext.addError(error)
    if (RudiError.isRudiHttpError(error)) {
      if (shouldShowErrorPile()) {
        RudiError.logErrorPile(error)
      }
      reqContext.addError(error)
      const primeError = error[TRACE][0]
      log.e(
        primeError.mod,
        primeError.fun,
        `Error ${error.statusCode} (${error.name}): ${error.message}`,
        reqContext
      )
      log.sysError(
        `Error ${error.statusCode} (${error.name}): ${error.message}`,
        `${primeError.mod}.${primeError.fun}`,
        reqContext,
        reqContext.getDetails()
      )
    } else {
      log.sysError(error, `${mod}.${fun}`, reqContext, reqContext.getDetails())
    }
  } catch (err) {
    log.e(mod, fun, err)
    const context = CallContext.getCallContextFromReq(request)
    log.sysError(err, `${mod}.${fun}`, context, context.getDetails())
    throw RudiError.treatError(mod, fun, err)
  }
  done()
})

fastify.setErrorHandler((error, request, reply) => {
  const fun = 'finalErrorHandler'
  log.t(mod, fun, ``)
  try {
    // log.d(mod, fun, RudiError.isRudiHttpError(error))
    let rudiHttpError
    if (RudiError.isRudiHttpError(error)) rudiHttpError = error
    else {
      rudiHttpError = RudiError.createRudiHttpError(error.statusCode, error.message || error)
    }
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
  reply.code(404).send(response)
})

fastify.setNotFoundHandler(fastify.notFound)

// ------------------------------------------------------------------------------------------------
// Fastify hooks: request receive / send
// ------------------------------------------------------------------------------------------------
fastify.addHook('onRequest', (req, res, next) => {
  const fun = 'onRequest'
  log.t(mod, fun, `----- new request -----vvv---`)
  req[TRACE_TIME] = utils.nowEpochMs()

  const callContext = new CallContext()
  callContext.setIpsFromRequest(req)
  callContext.setReqDetails(req.method, req.url, req.context.config[ROUTE_NAME])
  callContext.addDetails('callTime', req[TRACE_TIME])
  CallContext.setAsReqContext(req, callContext)

  log.d(mod, fun, `req context: ${utils.beautify(req.callContext)}`)
  log.d(mod, fun, `callContext: ${utils.beautify(callContext)}`)
  log.v('http', fun, CallContext.createApiCallMsg(req))
  next()
})

fastify.addHook('onSend', (request, reply, payload, next) => {
  const fun = 'onSend'
  log.t(mod, fun, ``)
  const time = utils.nowEpochMs() - request[TRACE_TIME]

  const callContext = CallContext.getCallContextFromReq(request)
  callContext.addDetails(REQ_DURATION, time)
  callContext.statusCode = reply.statusCode
  // callContext.
  log.i(
    mod,
    fun,
    `API reply: ${request.method} ${request.url} (${
      request.context.config[ROUTE_NAME]
    }): ${utils.beautify(callContext)}`
  )

  // log.v(mod, fun, utils.beautify(callContext))
  log.sysInfo(
    `API reply: ${request.method} ${request.url} (${request.context.config[ROUTE_NAME]})`,
    `${mod}.${fun}`,
    callContext
  )
  log.t(mod, fun, `----- request sent (${time} ms) -----^^^--`)
  next()
})

// ------------------------------------------------------------------------------------------------
// ROUTES
// ------------------------------------------------------------------------------------------------

// Import Routes
const { publicRoutes, backOfficeRoutes, devRoutes, redirectRoutes } = require('./routes')
const { STATUS_CODE, ROUTE_NAME, TRACE } = require('../config/confApi')

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
