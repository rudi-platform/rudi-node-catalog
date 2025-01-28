const mod = 'jwtCtrl'

// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import {
  extractJwt,
  readPublicKeyFile,
  tokenStringToJwtObject,
  verifyToken,
} from '@aqmo.org/jwt-lib'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------

import { beautify, decodeBase64url, removeTrailingChar } from '../utils/jsUtils.js'
import { accessProperty } from '../utils/jsonAccess.js'

import { logD, logE, logT, logW } from '../utils/logging.js'

import { getProfile } from '../config/confSystem.js'
import { ForbiddenError, RudiError, UnauthorizedError } from '../utils/errors.js'

// -------------------------------------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------------------------------------
const PUB_KEY = 'pub_key'
const SUB_ACL = 'routes'
const REQ_ROUTE_ALL = 'all'

import { ROUTE_NAME } from '../config/constApi.js'
import { JWT_CLIENT, JWT_SUB, REQ_MTD, REQ_URL } from '../config/constJwt.js'
// -------------------------------------------------------------------------------------------------
// Controllers
// -------------------------------------------------------------------------------------------------

/**
 * Retrieve the string that states which algorithm was used for the
 * private/public key pair.
 * see https://datatracker.ietf.org/doc/html/rfc7518#section-3.1
 *
 * Note: 'ed25519' (EdDSA) is STRONGLY recommended
 * https://crypto.stackexchange.com/a/60390/94576
 *
 * @param {String} algo
 * @returns
 */
export const getJwtAlgo = (algo) => {
  const fun = 'getJwtAlgo'
  try {
    switch (algo) {
      case 'ed25519':
      case 'EdDSA':
        return 'EdDSA'
      case 'HS256':
      case 'ES256':
      case 'RS256':
      case 'PS256':
      case 'HS512':
      case 'ES512':
      case 'RS512':
      case 'PS512':
        return algo
      default:
        throw new Error(`Algo not recognized: '${algo}'`)
    }
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

/**
 * Hash algo to be used to sign the JWT
 * @param {String} algo
 * @returns
 */
export const getHashAlgo = (algo) => {
  const fun = 'getHashAlgo'
  try {
    switch (algo) {
      case 'HS256':
      case 'RS256':
      case 'ES256':
      case 'PS256':
        return 'sha256'
      case 'ES512':
      case 'HS512':
      case 'RS512':
      case 'PS512':
      case 'ed25519':
      case 'EdDSA':
        return 'sha512'
      default:
        throw new Error(`Algo not recognized: '${algo}'`)
    }
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

export const checkRequesterPermission = async (req, isCheckOptional) => {
  const fun = 'checkRequesterPermission'
  logT(mod, fun)
  try {
    let token
    try {
      // logI(mod, fun, `! req: ${beautify(req.headers)}`)
      token = extractJwt(req)
    } catch (err) {
      // logE(mod, fun, `err: ${err}`)
      if (isCheckOptional) throw err
      const msgStr = `${err.message}`
      const msg = removeTrailingChar(msgStr, '.')
      const error = new UnauthorizedError(`${msg} when requesting ${req.url}`)
      throw RudiError.treatError(mod, fun, error)
    }
    // logD(mod, fun, `token: ${token}`)
    const { subject, clientId } = await verifyRudiCatalogToken(token, req.method, req.url)
    // logD(mod, fun, `subject: ${subject}, clientId: ${clientId}`)

    // Check the ACL (= does the subject have permission to enter this route?)
    // logD(mod, fun, `req: ${beautify(req.context.config[ROUTE_NAME])}`)

    const reqRouteName = accessProperty(req.routeOptions?.config, ROUTE_NAME)
    checkSubjPermission(subject, reqRouteName)
    return { subject, clientId }
    // return 'ok'
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

function checkSubjPermission(subject, reqRouteName) {
  const fun = 'checkSubjPermission'
  logT(mod, fun)

  const subjProfile = getProfile(subject)
  const subjAcl = accessProperty(subjProfile, SUB_ACL)
  if (!subjAcl.includes(reqRouteName) && !subjAcl.includes(REQ_ROUTE_ALL))
    throw new ForbiddenError(
      `Current subject '${subject}' cannot access this route (${reqRouteName})`
    )
  return true
}

const CACHED_PUB_KEYS = {}
const getPubKey = (subject) => {
  const fun = 'getPubKey'
  try {
    const subjProfile = getProfile(subject)
    // logD(mod, fun + ' profile:', beautify(subjProfile))
    const keyFile = subjProfile[PUB_KEY]
    if (!keyFile)
      throw new ForbiddenError(`Wrong configuration, public key path not found for '${subject}'`)

    if (!CACHED_PUB_KEYS[subject]) CACHED_PUB_KEYS[subject] = readPublicKeyFile(keyFile)
    return CACHED_PUB_KEYS[subject]
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

export const verifyRudiCatalogToken = async (token, reqMethod, reqUrl) => {
  const fun = 'verifyRudiCatalogToken'
  try {
    // Retrieve the public key
    const { payload } = tokenStringToJwtObject(token)
    logD(mod, fun, beautify(payload))

    const subject = accessProperty(payload, JWT_SUB)
    const pubKey = getPubKey(subject)
    // logV(mod, fun + ' pubKey:', pubKey)
    try {
      verifyToken(pubKey, token)
    } catch (e) {
      logE(mod, fun, e)
      logE(mod, fun, token)
      throw new ForbiddenError(beautify(e.message || e))
    }
    logT(mod, fun, 'Token in request headers is OK')
    // Check the current route
    const jwtMtd = accessProperty(payload, REQ_MTD)
    if (jwtMtd !== reqMethod && jwtMtd !== REQ_ROUTE_ALL)
      throw new ForbiddenError(
        `The http request method '${reqMethod}' doesn't match what has been declared in the JWT: '${jwtMtd}'`
      )
    const jwtUrl = accessProperty(payload, REQ_URL)
    if (jwtUrl !== reqUrl && jwtUrl !== REQ_ROUTE_ALL)
      throw new ForbiddenError(
        `The request URL '${reqUrl}' doesn't match what has been declared in the JWT: '${jwtUrl}'`
      )

    // Identify the subject (= caller/requester)
    const clientId = payload[JWT_CLIENT]

    return { subject, clientId }
  } catch {
    logW(mod, fun, `The JWT could not be validated: ${token}`)
    const error = new ForbiddenError(`The JWT could not be validated`)
    throw RudiError.treatError(mod, fun, error)
  }
}

export const isRudiCatalogToken = (token) => {
  const fun = 'isRudiCatalogToken'
  try {
    const jwtPayloadBase64url = token.split('.')[1]
    const jwtPayload = JSON.parse(decodeBase64url(jwtPayloadBase64url))
    return !!jwtPayload[REQ_MTD]
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}
