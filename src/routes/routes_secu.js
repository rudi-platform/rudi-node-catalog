const mod = 'fastify'

// -------------------------------------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------------------------------------
import { URL_PREFIX_PRIVATE } from '../config/constApi.js'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { beautify } from '../utils/jsUtils.js'

import { shouldControlPrivateRequests, shouldControlPublicRequests } from '../config/confSystem.js'

import { JWT_USER, isPortalConnectionDisabled } from '../config/confPortal.js'

import { logD, logT, logW } from '../utils/logging.js'

import { JWT_CLIENT, JWT_SUB } from '../config/constJwt.js'

import { RudiError } from '../utils/errors.js'

import { CallContext } from '../definitions/constructors/callContext.js'

import { getRoutes } from './routes.js'

import { checkPortalTokenInHeader } from '../controllers/portalController.js'
import { checkRequesterPermission } from '../controllers/tokenController.js'

// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
// Require the fastify framework and instantiate it
// import fastifyMultipart from '@fastify/multipart'
import { markdownTable } from 'markdown-table'

// -------------------------------------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------------------------------------

// -------------------------------------------------------------------------------------------------
// Pre-handler functions
// -------------------------------------------------------------------------------------------------
/**
 * Pre-handler for requests that need no authentication ("free routes")
 * @param {object} req incoming request
 * @param {object} reply reply
 */
export async function onPublicRoute(req, reply) {
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
export async function onPortalRoute(req, reply) {
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
export async function onPrivateRoute(req, reply) {
  const fun = 'onPrivateRoute'
  try {
    logT(mod, fun, `${req.method} ${req.url} `)
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
export async function onUnrestrictedPrivateRoute(req, reply) {
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

export const getRestApi = (req) => {
  if (!req?.query?.format || req.query.format == 'md') return generateRestApiMarkdown()
  if (req.query.format == 'list' || req.query.format == 'array') {
    const routeList = []
    Object.keys(getRoutes()).forEach((group) => {
      getRoutes(group).forEach((route) => {
        const { method, url } = route
        const description = route.description ?? 'No description provided'
        routeList.push([group, method, url, description])
      })
    })
    return routeList
  }

  if (req.query.format == 'group') {
    const routeList = {}
    Object.keys(getRoutes()).forEach((group) => {
      routeList[group] = []

      getRoutes(group).forEach((route) => {
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

  Object.keys(getRoutes()).forEach((routeGroup) => {
    getRoutes(routeGroup).forEach((route) => {
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
