/* eslint-disable quote-props */
'use strict'

const mod = 'portalCtrl'

// -----------------------------------------------------------------------------
// External dependancies
// -----------------------------------------------------------------------------
const boom = require('@hapi/boom')
const crypto = require('crypto')

// -----------------------------------------------------------------------------
// Internal dependancies
// -----------------------------------------------------------------------------
const db = require('../db/dbQueries')
const log = require('../utils/logging')
const api = require('../config/confApi')
const utils = require('../utils/jsUtils')
const portal = require('../config/confPortal')
const { httpGet, httpPost, directPost, directGet } = require('../utils/httpReq')
const validate = require('../definitions/schemaValidators')
const json = require('../utils/jsonAccess')

const { Metadata } = require('../definitions/models/Metadata')

// -----------------------------------------------------------------------------
// Token manager
// -----------------------------------------------------------------------------
// const { RMTokenManager } = require('../definitions/constructors/RMTokenManager')
// const portalInfo = {
//   host: portal.API_GET_HOST,
//   port: portal.API_GET_PORT,
//   path_request: portal.API_GET_PATH,
//   path_check: portal.API_SEND_PATH,
//   login: portal.LOGIN,
//   passw: portal.PASSW,
// }
// const agent = `RUDI/${api.VERSION}`

// const tokenManager = new RMTokenManager(portalInfo, agent)

// -----------------------------------------------------------------------------
// REST access
// -----------------------------------------------------------------------------
exports.exposedGetPortalToken = async (req, reply) => {
  const fun = 'exposedGetPortalToken'
  log.d(mod, fun, `< GET new portal token`)
  try {
    return await this.getPortalToken()
  } catch (err) {
    log.w(mod, fun, err)
    throw boom.boomify(err)
  }
}
// -----------------------------------------------------------------------------
// Controllers
// -----------------------------------------------------------------------------

/**
 * Get a new token from the portal
 */
exports.getPortalToken = async () => {
  const fun = 'getPortalToken'
  log.d(mod, fun, ``)
  let token
  try {
    const rmToken = await db.getLatestStoredPortalToken()
    if (!rmToken) {
      throw new Error('No token in cache')
    }
    token = json.accessProperty(rmToken, portal.FIELD_TOKEN)
    // log.d(mod, fun, `token: ${utils.beautify(token)}`)
    await this.verifyPortalToken(token)
    log.d(mod, fun, 'Stored token seems OK')

    await this.getTokenCheckedByPortal(token)
    // log.d(mod, fun, 'Stored token was validated by the Portal')
  } catch (err) {
    log.w(mod, fun, err)
    try {
      const rmToken = await this.getNewTokenFromPortal()
      token = json.accessProperty(rmToken, portal.FIELD_TOKEN)
    } catch (err) {
      log.w(mod, fun, err)
      throw new Error(`Failed to get a new token from the portal: ${err}`)
    }
  }
  return token
}

/**
 * Ensure a token is valid
 */
exports.checkStoredToken = async (req, reply) => {
  const fun = 'checkStoredToken'
  log.d(mod, fun, ``)
  // log.d(mod, fun, `< GET portal check token`)
  try {
    const token = await db.getLatestStoredPortalToken()
    return await this.getTokenCheckedByPortal(token[portal.FIELD_TOKEN])
  } catch (err) {
    log.w(mod, fun, err)
    throw boom.boomify(err)
  }
}

exports.checkInputToken = async (req, reply) => {
  const fun = 'checkInputToken'
  log.d(mod, fun, ``)
  try {
    const token = json.accessReqParam(req.params, portal.PARAM_TOKEN)
    return await this.getTokenCheckedByPortal(token[portal.FIELD_TOKEN])
  } catch (err) {
    log.w(mod, fun, err)
    throw boom.boomify(err)
  }
}

exports.getMetadata = async (req, reply) => {
  const fun = 'getMetadata'
  log.d(mod, fun, ``)
  try {
    let metadataId = req.params[api.PARAM_ID]
    log.d(mod, fun, `metadataId: ${metadataId}`)
    if (metadataId && !validate.isUUID(metadataId)) metadataId = null

    return await this.getMetadataFromPortal(metadataId)
  } catch (err) {
    log.w(mod, fun, err)
    throw boom.boomify(err)
  }
}
exports.sendMetadata = async (req, reply) => {
  const fun = 'sendMetadata'
  log.d(mod, fun, ``)
  try {
    let metadataId = req.params[api.PARAM_ID]
    log.d(mod, fun, `metadataId: ${metadataId}`)
    if (metadataId && !validate.isUUID(metadataId)) metadataId = null

    return await this.sendMetadataToPortal(metadataId)
  } catch (err) {
    log.w(mod, fun, err)
    throw boom.boomify(err)
  }
}
// -----------------------------------------------------------------------------
// Functions: Portal calls
// -----------------------------------------------------------------------------

exports.getNewTokenFromPortal = async () => {
  const fun = 'getNewTokenFromPortal'
  try {
    const usr = portal.LOGIN
    const pwd = portal.PASSW

    const portalUrl = portal.getAuthUrl()
    const body = `grant_type=password&scope=read&client_id=${usr}&username=${usr}&password=${pwd}`

    const basicAuth = utils.toBase64(`${usr}:${pwd}`)

    const opts = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': `RudiProd/${api.VERSION}`,
        Authorization: `Basic ${basicAuth}`,
      },
    }

    const answer = await directPost(portalUrl, body, opts)
    // log.d(mod, fun, `answer.status: ${answer.status}`)

    if (answer.status === 200) {
      const portalToken = answer.data
      const jwToken = portalToken[portal.FIELD_TOKEN]
      const jwtBody = this.verifyPortalToken(jwToken)[1]
      portalToken[portal.JWT_EXP] = jwtBody[portal.JWT_EXP]
      log.d(
        mod,
        fun,
        `We got a new token, that expires on ${utils.dateEpochSToIso(jwtBody[portal.JWT_EXP])}`
      )
      await db.storePortalToken(portalToken)

      return portalToken
    } else {
      throw new Error(utils.beautify(answer))
    }
  } catch (err) {
    const errMsg = `Portal couldn't deliver a token: ${err}`
    log.w(mod, fun, errMsg)
    throw err
  }
}

exports.getTokenCheckedByPortal = async (token) => {
  const fun = 'getTokenCheckedByPortal'
  log.d(mod, fun, ``)
  try {
    const portalUrl = portal.getCheckAuthUrl()

    const requestUrl = `${portalUrl}?${portal.PARAM_TOKEN}=${token}`
    // log.d(mod, fun, requestUrl)
    const portalResponse = await directGet(requestUrl)

    if (portalResponse.status === 200) {
      log.v(mod, fun, `RUDI Portal validated the token`)
      return portalResponse.data
    } else {
      const errMsg = `Portal invalidated the token: ${portalResponse.data}`
      log.w(mod, fun, errMsg)
      throw new Error(errMsg)
    }
  } catch (err) {
    log.w(mod, fun, err)
    throw err
  }
}

/*
jwtHeader = {
      'alg': 'HS256',
      'typ': 'JWT'
}
jwtBody = {
  'exp': 1622063934,
  'user_name': <uuid>,
  'authorities': ['PROVIDER'],
  'jti': <uuid>,
  'client_id': <uuid>,
  'scope': ['read']
}
*/
exports.verifyPortalToken = (accessToken) => {
  const fun = 'verifyPortalToken'
  log.d(mod, fun, ``)

  try {
    const jwt = accessToken.split('.')

    // Check JWT signature
    const jwtHeaderEncoded = jwt[0]
    const jwtBodyEncoded = jwt[1]
    const jwtSignature = jwt[2]

    const hash = crypto
      .createHmac('sha256', portal.SECRET)
      .update(`${jwtHeaderEncoded}.${jwtBodyEncoded}`)
      .digest('base64url')

    if (hash !== jwtSignature) {
      const errMsg = `Forged token? Computed hash: ${hash} != jwt signature: ${jwtSignature}`
      log.w(mod, fun, errMsg)
      throw new Error(errMsg)
    }
    // else {
    //   log.v(mod, fun, `JWT correctly signed`)
    // }

    // Check JWT header
    const jwtHeader = JSON.parse(utils.decodeBase64(jwtHeaderEncoded))
    // log.d(mod, fun, `jwtHeader :${utils.beautify(jwtHeader)}`)

    if (jwtHeader[portal.JWT_TYP] !== 'JWT')
      throw new Error(`Received token is not a JWT: ${utils.beautify(jwtHeader)}`)

    // Check JWT body
    const jwtBody = JSON.parse(utils.decodeBase64(jwtBodyEncoded))

    if (jwtBody[portal.JWT_USER] !== portal.LOGIN) throw new Error('Portal JWT: incorrect user')
    if (jwtBody[portal.JWT_CLIENT] !== portal.LOGIN) throw new Error('Portal JWT: incorrect client')
    if (jwtBody[portal.JWT_EXP] < utils.nowEpochS())
      throw new Error(
        `Portal JWT expired: ` +
          `expire_date=${utils.dateEpochSToIso(jwtBody[portal.JWT_EXP])}` +
          ` < now=${utils.dateEpochSToIso(utils.nowEpochS())}`
      )

    return [jwtHeader, jwtBody]
  } catch (err) {
    const errMsg = `Invalid token: ${err}`
    log.w(mod, fun, errMsg)
    throw err
  }
}

exports.sendMetadataToPortal = async (metadataId) => {
  const fun = 'sendMetadataToPortal'
  log.d(mod, fun, ``)
  try {
    if (!metadataId) throw new Error('Not yet implemented')

    const metadata = await db.getEnsuredObjectWithRudiId(api.PARAM_OBJECT_METADATA, metadataId)
    if (!metadata) {
      const errMsg = `No data found locally for id '${metadataId}'`
      log.w(mod, fun, errMsg)
      throw new Error(errMsg)
    }
    const metadataClean = utils.deepClone(metadata)

    const token = await this.getPortalToken()
    const reply = await httpPost(portal.postPortalMetaUrl(), metadataClean, token)
    // log.d(mod, fun, `reply: ${utils.beautify(reply)}`)
    return reply
  } catch (err) {
    log.w(mod, fun, err)
    throw err
  }
}

exports.getMetadataFromPortal = async (metadataId) => {
  const fun = 'getMetadataFromPortal'
  log.d(mod, fun, ``)
  try {
    if (!metadataId) throw new Error('Not yet implemented on Portal side') // Can't get the resouces list yet.

    const token = await this.getPortalToken()
    const reply = await httpGet(portal.getPortalMetaUrl(metadataId), token)

    return reply
  } catch (err) {
    log.w(mod, fun, err)
    throw err
  }
}

exports.convertToPortalFormat = (metadata) => {
  // metadata[]
}
