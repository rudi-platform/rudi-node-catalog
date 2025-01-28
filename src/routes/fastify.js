const mod = 'fastify'

// -------------------------------------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------------------------------------
import { ROUTE_NAME, STATUS_CODE, URL_PREFIX_PRIVATE } from '../config/constApi.js'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { beautify, padA1, timeEpochMs } from '../utils/jsUtils.js'

import {
  getCatalog,
  getPrivatePath,
  getServerAddress,
  getServerPort,
  shouldControlPrivateRequests,
  shouldControlPublicRequests,
} from '../config/confSystem.js'

import { SHOULD_SYSLOG, shouldShowErrorPile, shouldShowRoutes } from '../config/confLogs.js'

import { JWT_USER, isPortalConnectionDisabled } from '../config/confPortal.js'

import {
  logD,
  logE,
  logI,
  logLine,
  logT,
  logV,
  logW,
  sysCrit,
  sysNotice,
  sysOnError,
} from '../utils/logging.js'

import { JWT_CLIENT, JWT_SUB } from '../config/constJwt.js'

import { RudiError } from '../utils/errors.js'

import { CallContext } from '../definitions/constructors/callContext.js'

import {
  backOfficeRoutes,
  devRoutes,
  portalRoutes,
  publicRoutes,
  unrestrictedPrivateRoutes,
} from './routes.js'

import { checkPortalTokenInHeader } from '../controllers/portalController.js'
import { checkRequesterPermission } from '../controllers/tokenController.js'
import { getUrlMaxLength } from '../utils/protection.js'

// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
// Require the fastify framework and instantiate it
// import fastifyMultipart from '@fastify/multipart'
import fastifyCompress from '@fastify/compress'
import fastify from 'fastify'
import { markdownTable } from 'markdown-table'
import { createIpsMsg } from '../utils/httpReq.js'

// const fastifyLogger = new FFLogger('warn')
const catalogApp = fastify({
  // logger: fastifyLogger,
  // logger: initFFLogger(),
  // logger: {
  //    level: 'warn',
  //    file: sys.OUT_LOG,
  // },
  ignoreTrailingSlash: true,
})

// -------------------------------------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------------------------------------

// -------------------------------------------------------------------------------------------------
// Fastify conf: declare routes
// -------------------------------------------------------------------------------------------------

export const launchRouteListener = async () => {
  const fun = 'launchRouteListener'
  try {
    await catalogApp.register(fastifyCompress, { global: true }, { threshold: 1024 })
    // await catalogApp.register(fastifyMultipart)

    declareRoutes()
    catalogApp.listen({
      port: getServerPort(),
      host: getServerAddress(),
      listenTextResolver: (address) => logI(mod, fun, `App listening on ${address}${getCatalog()}`),
    })
  } catch (err) {
    logE(mod, fun, `${err}`)
    sysCrit(`Fastify launch: ${err}`, 'rudiServer.routeListener', {}, { error: err })
    throw new RudiError('Could not launch fastify server')
  }
  // fastify.swagger()
}
// -------------------------------------------------------------------------------------------------
// Fastify hooks: errors
// -------------------------------------------------------------------------------------------------
catalogApp.addHook('onError', (request, reply, error, done) => {
  const fun = 'onError'
  try {
    logV(mod, fun, ``)
    // logD(mod, fun, `isRudiError: ${RudiError.isRudiError(error)}`)
    // logD(mod, fun, `showErrorPile: ${shouldShowErrorPile()}`)

    const reqContext = CallContext.getCallContextFromReq(request)
    if (RudiError.isRudiError(error) && shouldShowErrorPile()) RudiError.logErrorPile(error)

    if (reqContext) {
      reqContext.logErr(mod, fun, error)
    } else {
      sysOnError(error.statusCode, '[onError] ' + beautify(error))
    }
    reply.isError = true
  } catch (err) {
    logE(mod, fun, err)
    // const context = CallContext.getCallContextFromReq(request)
    // context.logErr(mod, fun, err)
    // throw context.getError()
    throw err
  }
  done()
})

catalogApp.setErrorHandler((error, request, reply) => {
  const fun = 'finalErrorHandler'
  try {
    logT(mod, fun)
    // logD(mod, fun, RudiError.isRudiError(error))
    let rudiHttpError
    if (RudiError.isRudiError(error)) {
      logV(mod, fun, beautify(error))
      rudiHttpError = error
    } else {
      logI(mod, fun, beautify(error))
      rudiHttpError = RudiError.createRudiHttpError(
        error.statusCode,
        error.message || error,
        mod,
        fun,
        error.path
      )
    }

    if (shouldShowErrorPile()) RudiError.logErrorPile(rudiHttpError)

    const errorResponse = {
      [STATUS_CODE]: rudiHttpError[STATUS_CODE] || 500,
      error: rudiHttpError.name,
      message: rudiHttpError.message,
      path: rudiHttpError.path,
    }

    reply.isError = true
    logI(mod, fun, beautify(errorResponse))
    // reply.code(rudiHttpError[STATUS_CODE]).send(rudiHttpError)
    reply.code(errorResponse[STATUS_CODE]).send(errorResponse)

    // sysError(`Error ${rudiHttpError.statusCode}: ${rudiHttpError.message}`)
  } catch (uncaughtErr) {
    logE(mod, fun, `Uncaught! ${uncaughtErr}`)
    sysCrit(
      `Uncaught error: ${uncaughtErr}`,
      'ff.errorHandler',
      CallContext.getReqContext(request),
      { error: uncaughtErr }
    )
  }
  logT(mod, fun, 'done')
})

catalogApp.decorate('notFound', (req, reply) => {
  const fun = 'route404'
  // const ip = req.ip

  const response = {
    message: `Route '${req.method} ${req.url}' not found`,
    error: 'Not Found',
    statusCode: 404,
  }
  const context = CallContext.getCallContextFromReq(req)
  logW(mod, fun, `${response.message} <- ${context.apiCallMsg}`)
  sysNotice(`Error 404: ${response.message}`, '', CallContext.getReqContext(req))
  // logD(mod, fun, beautify(req))
  reply.isError = true
  reply.code(404).send(response)
})

catalogApp.setNotFoundHandler(catalogApp.notFound)

// -------------------------------------------------------------------------------------------------
// Fastify hooks: request receive / send
// -------------------------------------------------------------------------------------------------
catalogApp.addHook('onRequest', (req, res, next) => {
  const fun = 'onRequest'
  try {
    const context = new CallContext()
    logV('', '', `----- Rcv req #${context.id} from ${createIpsMsg(req)} -----vvv---`)
    // logV(mod, fun, req.url)
    const now = timeEpochMs()
    context.setIpsFromRequest(req)
    context.timestamp = now
    try {
      CallContext.preventCodeInjection(req)
    } catch (err) {
      context.setReqDescription(
        req.method,
        req.url.slice(0, getUrlMaxLength()),
        req.routeOptions?.config[ROUTE_NAME]
      )
      CallContext.setAsReqContext(req, context)
      throw err
    }
    context.setReqDescription(req.method, req.url, req.routeOptions?.config[ROUTE_NAME])
    CallContext.setAsReqContext(req, context)

    logT('http', fun, CallContext.createApiCallMsg(req))
    next()
  } catch (err) {
    // logE(mod, fun, err)
    throw RudiError.treatError(mod, fun, err)
  }
})

catalogApp.addHook('onSend', (request, reply, payload, next) => {
  const fun = 'onSend'
  try {
    // logT(mod, fun)
    const now = timeEpochMs()
    const context = CallContext.getCallContextFromReq(request)
    if (context) {
      context.duration = now - context.timestamp
      context.statusCode = reply.statusCode
      if (!reply.isError) context.logInfo(mod, fun, 'API reply')
      logV('', '', `----- Send reply #${context.id} (${context.duration} ms) -----^^^--`)
    }
    next()
  } catch (err) {
    logE(mod, fun, err)
  }
})

// -------------------------------------------------------------------------------------------------
// Exports
// -------------------------------------------------------------------------------------------------

// -------------------------------------------------------------------------------------------------
// Pre-handler functions
// -------------------------------------------------------------------------------------------------
/**
 * Pre-handler for requests that need no authentication ("free routes")
 * @param {object} req incoming request
 * @param {object} reply reply
 */
async function onPublicRoute(req, reply) {
  const fun = 'onPublicRoute'
  try {
    logT(mod, fun, `${req.method} ${req.url} `)
    const context = CallContext.getCallContextFromReq(req)

    if (isPortalConnectionDisabled()) {
      try {
        const { subject, clientId } = await checkRequesterPermission(req, true)
        context.clientApp = subject
        context.reqUser = clientId
      } catch {
        // It's OK to have no token
        logT(mod, fun, `Token-less call to ${req.method} ${req.url} `)
      }
    } else {
      try {
        // Checking the token, if it exists, to retrieve the user info
        const portalJwt = await checkPortalTokenInHeader(req, true)
        const jwtPayload = portalJwt[1]
        logD(mod, fun, `Payload: ${beautify(jwtPayload)}`)
        context.clientApp = jwtPayload[JWT_SUB] ?? 'RUDI Portal'
        context.reqUser = jwtPayload[JWT_USER] ?? jwtPayload[JWT_CLIENT]
      } catch {
        try {
          const { subject, clientId } = await checkRequesterPermission(req, true)
          context.clientApp = subject
          context.reqUser = clientId
        } catch {
          // It's OK to have no token
          logT(mod, fun, `Token-less call to ${req.method} ${req.url} `)
        }
      }
      context.logInfo('route', fun, 'v1 API call')
    }
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

/**
 * Pre-handler for requests that need a "public" (aka portal) authentication
 * ("public routes")
 * @param {object} req incoming request
 * @param {object} reply reply
 */
async function onPortalRoute(req, reply) {
  const fun = 'onPortalRoute'
  try {
    logT(mod, fun, `${req.method} ${req.url} `)
    if (!shouldControlPublicRequests()) return true

    // If incoming request has no token, raise an error
    const portalJwt = await checkPortalTokenInHeader(req, false)
    const jwtPayload = portalJwt[1]
    logD(mod, fun, `Payload: ${beautify(jwtPayload)}`)

    const context = CallContext.getCallContextFromReq(req)
    context.clientApp = jwtPayload[JWT_SUB] ?? 'RUDI Portal'
    context.reqUser = jwtPayload[JWT_USER] ?? jwtPayload[JWT_CLIENT]

    context.logInfo('route', fun, 'API call')
    return true
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

/**
 * Pre-handler for requests that need a "private" (aka rudi producer node)
 * authentication ("private/back-office routes")
 * These requests should normally bear a user identification
 * @param {object} req incoming request
 * @param {object} reply reply
 */
async function onPrivateRoute(req, reply) {
  const fun = 'onPrivateRoute'
  try {
    // logT(mod, fun, `${req.method} ${req.url} `)
    if (!shouldControlPrivateRequests()) {
      logW(
        mod,
        fun,
        'Not checking incoming JWT, set "should_control_public_requests = true" to enforce checking'
      )
      return true
    }

    const { subject, clientId } = await checkRequesterPermission(req, false)

    const context = CallContext.getCallContextFromReq(req)
    context.clientApp = subject
    context.reqUser = clientId

    context.logInfo('route', fun, 'API call')
    return
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

/**
 * Pre-handler for private requests that don't need an
 * authentication ("unrestricted private routes")
 * These requests are normally not user driven actions, but sent by an app
 * such as the prodmanager
 * @param {object} req incoming request
 * @param {object} reply reply
 */
async function onUnrestrictedPrivateRoute(req, reply) {
  const fun = 'onUnrestrictedPrivateRoute'
  try {
    logT(mod, fun, `${req.method} ${req.url} `)
    const context = CallContext.getCallContextFromReq(req)

    try {
      const { subject, clientId } = await checkRequesterPermission(req, true)
      context.clientApp = subject
      context.reqUser = clientId
    } catch {
      // It's OK to have no token
      logT(mod, fun, `Token-less call to ${req.method} ${req.url} `)
    } finally {
      context.logInfo('route', fun, 'API call')
    }
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

// -------------------------------------------------------------------------------------------------
// ROUTES
// -------------------------------------------------------------------------------------------------
let toggle = true
function declareRouteGroup(routeGroupName, routeGroup, preHandler) {
  const fun = 'declareRouteGroup'
  // logT(mod, 'declareRouteGroup', routeGroupName)

  try {
    routeGroup.map((route, index) => {
      // logT(mod, 'declareRouteGroup', `${routeGroupName} ${index}`)
      route.preHandler = preHandler
      catalogApp.route(route)
      const displayRoute = `${padA1(index)}: ${route.method} ${route.url}`
      if (shouldShowRoutes())
        if (SHOULD_SYSLOG)
          logLine(toggle ? 'info' : 'debug', routeGroupName, 'routes', displayRoute)
        else
          logLine(
            toggle ? 'info' : 'debug',
            routeGroupName,
            'routes',
            `${routeGroupName}: ${displayRoute}`
          )
    })
    toggle = !toggle
  } catch (err) {
    logE(mod, fun, err)
    RudiError.treatError(mod, 'declareRouteGroup', err)
  }
}

/**
 * Pre-handler function assignments
 */
const declareRoutes = () => {
  // logT(mod, 'declareRoutes')
  // declareRouteGroup(redirectRoutes, onPortalRoute, 'Redirect', 'd')
  declareRouteGroup('Public', publicRoutes, onPublicRoute)
  declareRouteGroup('Portal', portalRoutes, onPortalRoute)
  declareRouteGroup('Unrestricted', unrestrictedPrivateRoutes, onUnrestrictedPrivateRoute)
  declareRouteGroup('Private', backOfficeRoutes, onPrivateRoute)
  declareRouteGroup('RudiNode', devRoutes, onPrivateRoute)
  declareRouteGroup(
    'API',
    [
      {
        description: 'Generate the documentation for the REST API of this microservice',
        method: 'GET',
        url: getPrivatePath('routes'),
        handler: getRestApi,
        config: { [ROUTE_NAME]: 'dev_api' },
      },
    ],
    onPrivateRoute
  )
}

const ROUTES = {
  public: [...publicRoutes, ...unrestrictedPrivateRoutes],
  jwt: [...portalRoutes, ...backOfficeRoutes, ...devRoutes],
}
export const getRestApi = (req) => {
  if (!req?.query?.format || req.query.format == 'md') return generateRestApiMarkdown()
  if (req.query.format == 'list' || req.query.format == 'array') {
    const routeList = []
    Object.keys(ROUTES).forEach((group) => {
      ROUTES[group].forEach((route) => {
        const { method, url } = route
        const description = route.description ?? 'No description provided'
        routeList.push([group, method, url, description])
      })
    })
    return routeList
  }

  if (req.query.format == 'group') {
    const routeList = {}
    Object.keys(ROUTES).forEach((group) => {
      routeList[group] = []

      ROUTES[group].forEach((route) => {
        const { method, url } = route
        const description = route.description ?? 'No description provided'
        routeList[group].push({ method, url, description })
      })
    })
    return routeList
  }
  return generateRestApiMarkdown()
}

export const generateRestApiMarkdown = () => {
  const markdownRoutes = [['Auth', 'Method', 'URL', 'Description']]

  Object.keys(ROUTES).forEach((routeGroup) => {
    ROUTES[routeGroup].forEach((route) => {
      const { method, url } = route
      const description = route.description ?? 'No description provided'
      markdownRoutes.push([routeGroup, method, url, description])
    })
    markdownRoutes.push([' ', ' ', ' ', ' '])
  })
  markdownRoutes.push([
    'jwt',
    'GET',
    `${URL_PREFIX_PRIVATE}/routes`,
    'Generate the documentation for the REST API of this microservice',
  ])
  return markdownTable(markdownRoutes)
}

export const shutDownListener = async (signal) => {
  const fun = 'shutDownListener'
  logI(mod, fun, `Received signal to shutdown: ${signal}`)
  try {
    await catalogApp.close()
    logI(mod, fun, 'OK', false)
  } catch (e) {
    logE(mod, fun + '.err', e, false)
  }
}
