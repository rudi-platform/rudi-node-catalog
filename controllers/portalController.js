/* eslint-disable quote-props */
'use strict'

const mod = 'portalCtrl'

// -----------------------------------------------------------------------------
// External dependancies
// -----------------------------------------------------------------------------
const { readFileSync } = require('fs')
const { parseKey } = require('sshpk')

// -----------------------------------------------------------------------------
// Internal dependancies
// -----------------------------------------------------------------------------
const db = require('../db/dbQueries')
const log = require('../utils/logging')
const api = require('../config/confApi')
const utils = require('../utils/jsUtils')
const json = require('../utils/jsonAccess')

const { httpGet, httpPost, httpDelete, directPost, directGet } = require('../utils/httpReq')

const portal = require('../config/confPortal')

const validate = require('../definitions/schemaValidators')

const { Metadata } = require('../definitions/models/Metadata')
const {
  NotFoundError,
  InternalServerError,
  NotImplementedError,
  BadRequestError,
  ForbiddenError,
  createRudiHttpError,
  ParameterExpectedError,
  NotAcceptableError,
  ObjectNotFoundError,
} = require('../utils/errors')

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
    log.d(mod, fun, portal.getAuthUrl())
    return await this.getNewTokenFromPortal()
  } catch (err) {
    log.w(mod, fun, err)
    throw err
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
      throw err
      //  new InternalServerError(`Failed to get a new token from the portal: ${err}`)
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
    if(!token) throw new NotFoundError('No Portal token is actually stored')
    return await this.getTokenCheckedByPortal(token[portal.FIELD_TOKEN])
  } catch (err) {
    log.w(mod, fun, err)
    throw err
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
    throw err
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
    throw err
  }
}

exports.sendMetadata = async (req, reply) => {
  const fun = 'sendMetadata'
  log.d(mod, fun, ``)
  try {
    let metadataId = req.params[api.PARAM_ID]
    log.d(mod, fun, `metadataId: ${metadataId}`)
    if (metadataId && !validate.isUUID(metadataId)) metadataId = null

    return await this.postMetadataToPortal(metadataId)
  } catch (err) {
    log.w(mod, fun, err)
    throw err
  }
}

exports.deleteMetadata = async (req, reply) => {
  const fun = 'deleteMetadata'
  log.d(mod, fun, ``)
  try {
    let metadataId = req.params[api.PARAM_ID]
    log.d(mod, fun, `metadataId: ${metadataId}`)
    if (metadataId && !validate.isUUID(metadataId)) metadataId = null

    return await this.deletePortalMetadata(metadataId)
  } catch (err) {
    log.w(mod, fun, err)
    throw err
  }
}
// -----------------------------------------------------------------------------
// Portal calls: GET public key
// -----------------------------------------------------------------------------

// ----- GET Portal public key
exports.getPortalPublicKey = () => {
  const fun = 'getPortalPublicKey'
  log.d(mod, fun, ``)

  const publicKeyObj = this.PUBLIC_KEY_URL ? httpGet(this.PUBLIC_KEY_URL) : null
  const publicKey = publicKeyObj ? publicKeyObj.value : null

  log.d(mod, fun, `publicKey: ${publicKey}`)
}

// -----------------------------------------------------------------------------
// Portal calls: token
// -----------------------------------------------------------------------------

exports.getNewTokenFromPortal = async () => {
  const fun = 'getNewTokenFromPortal'
  log.d(mod, fun, ``)
  try {
    const [usr, pwdb64] = portal.getCredentials()
    const portalAuthUrl = portal.getAuthUrl()
    log.d(mod, fun, `portal URL: ${portalAuthUrl}`)
    
    // LM -- the password is now provided in base64
    const pwd = utils.decodeBase64(pwdb64)
    // log.d(mod, fun, `pwdb64: ${pwdb64}`)
    // log.d(mod, fun, `pwd: ${pwd}`)
    // const body = {
    //   grant_type: 'password',
    //   scope: 'read',
    //   username: usr,
    //   password: pwd,
    // }
    // const body = `grant_type=password&scope=read&username=${usr}&password=${pwd}`
    const body =
      `grant_type=password&scope=read&username=${encodeURIComponent(usr)}&` +
      `password=${encodeURIComponent(pwd)}`
    // log.d(mod, fun, `body: ${body}`)

    const basicAuth = utils.padWithEqualSignBase4(utils.toBase64(`${usr}:${pwd}`))
    // log.d(mod, fun, `basicAuth: ${basicAuth}`)

    const opts = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': `RudiProd/${api.VERSION}`,
        Authorization: `Basic ${basicAuth}`,
      },
    }
    // log.d(mod, fun, utils.beautify(opts))
    let answer
    try {
      answer = await directPost(portalAuthUrl, body, opts)
    } catch (err) {
      const errMsg = `Post to portal failed: ${err}`
      log.w(mod, fun, errMsg)
      throw errMsg
    }
    // log.d(mod, fun, `answer.status: ${answer.status}`)

    if (answer.status === 200) {
      // log.d(mod, fun, `config: ${utils.beautify(answer.config)}`)
      // log.d(mod, fun, `data: ${utils.beautify(answer.data)}`)
      const portalToken = answer.data

      const jwToken = portalToken[portal.FIELD_TOKEN]
      if (typeof portalToken !== 'object' || !portalToken[portal.FIELD_TOKEN])
        throw new NotAcceptableError(`The portal delivered an incorrect reply: ${portalToken}`)

      // log.d(mod, fun, `portalToken: ${utils.beautify(portalToken)}`)

      const jwtBody = this.verifyPortalToken(jwToken)[1]
      portalToken[portal.JWT_EXP] = jwtBody[portal.JWT_EXP]
      log.d(
        mod,
        fun,
        `We got a new token, that expires on ${utils.dateEpochSToIso(jwtBody[portal.JWT_EXP])}`
      )
      await this.getTokenCheckedByPortal(portalToken[portal.FIELD_TOKEN])
      await db.storePortalToken(portalToken)

      return portalToken
    } else {
      const errMsg = `${utils.beautify(answer)}`
      // log.w(mod, fun, ôerrMsg)
      throw createRudiHttpError(answer.status, errMsg)
    }
  } catch (err) {
    const errMsg = `Failed to get a token from Portal: ${utils.beautify(err)}`
    log.w(mod, fun, errMsg)
    throw new ForbiddenError(errMsg)
  }
}

exports.getTokenCheckedByPortal = async (token) => {
  const fun = 'getTokenCheckedByPortal'
  log.d(mod, fun, ``)
  try {
    if (!token) throw new BadRequestError('No token to check!')
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
      throw new ForbiddenError(errMsg)
    }
  } catch (err) {
    log.w(mod, fun, err)
    throw err
  }
}

/* jwtHeader = {
  alg: 'RS512',                     // RSA 512
  typ: 'JWT'
}
jwtBody = {
  jti: '<uuid>',                    // ID du JWT
  authorities: ['rudi-prod-admin'], // ID de ton module
  exp: 1622063934,                  // Date d'expiration (absolue, Epoch, secondes)
  user_id: '<uuid>',                // Utilisateur qui effectue l'action
  org_id: '<uuid>',                 // Entreprise/organisation de l'utilisateur
  roles: ['admin','editor']         // Autorisations de l'utilisateur
} */
/*
jwtHeader = {
      alg: 'HS256',
      typ: 'JWT'
}
jwtBody = {
  exp: 1622063934,
  user_name: '<uuid>',
  authorities: ['PROVIDER'],
  jti: '<uuid>',
  client_id: '<uuid>',
  scope: ['read']
}
*/

exports.checkSignatureWithSecret = (accessToken) => {
  const fun = 'verifyPortalToken'
  log.d(mod, fun, ``)

  try {
    if (!accessToken) throw new BadRequestError('No token = no signature to verify!')
    const [jwtHeaderBase64, jwtPayloadBase64, jwtSignatureBase64] = accessToken.split('.')

    const hash = createHmac('sha256', portal.getSecret())
      .update(`${jwtHeaderBase64}.${jwtPayloadBase64}`)
      .digest('base64url')

    if (hash !== jwtSignatureBase64) {
      const errMsg = `Forged token? Computed hash: ${hash} != jwt signature: ${jwtSignatureBase64}`
      log.w(mod, fun, errMsg)
    }
    return hash === jwtSignatureBase64

    // if (hash !== jwtSignatureBase64) {
    //   const errMsg = `Forged token? Computed hash: ${hash} != jwt signature: ${jwtSignatureBase64}`
    //   log.w(mod, fun, errMsg)
    //   throw new Error(errMsg)
    // }
    // return true
  } catch (err) {
    const errMsg = `Invalid token: ${err}`
    log.w(mod, fun, errMsg)
    throw err
  }
}

const RUDI_PK_NAME = 'rudiPortal'
exports.checkSignatureWithPubKey = (accessToken) => {
  const fun = 'checkSignatureWithPubKey'
  log.d(mod, fun, ``)

  try {
    if (!accessToken) throw new BadRequestError('No token = no signature to check!')
    const [jwtHeaderBase64url, jwtPayloadBase64url, jwtSignatureBase64url] = accessToken.split('.')

    // Retrieve the public key
    let pubKeyPem
    try {
      pubKeyPem = readFileSync(portal.getPubKeyFile(), 'ascii')
    } catch (err) {
      throw new InternalServerError(`The file with the Portal public key can't be accessed: ${err}`)
    }

    let sslKey
    try {
      sslKey = parseKey(pubKeyPem)
    } catch (err) {
      throw new InternalServerError(
        `The Portal public key is incorrect, please check the content: ${err}`
      )
    }

    // log.d(mod, fun, `sslKey: ${utils.beautify(sslKey)}`)
    // const keyName = sslKey.comment && sslKey.comment !== '(unnamed)' ? `'${sslKey.comment}' ` : ''
    // log.d(mod, fun, `${keyName}public key: ${sslKey.type} ${sslKey.size} bits`)
    let signatureIsValid
    try {
      const verifier = sslKey.createVerify('sha256')
      verifier.update(`${jwtHeaderBase64url}.${jwtPayloadBase64url}`)
      signatureIsValid = verifier.verify(jwtSignatureBase64url, 'base64url')
    } catch (err) {
      throw new ForbiddenError(`Error while verifying the Portal token signature: ${err}`)
    }
    if (signatureIsValid) {
      log.i(mod, fun, `signature is valid`)
    } else {
      log.w(mod, fun, `signature is not valid`)
    }
    return signatureIsValid
  } catch (err) {
    // const errMsg = `Invalid token: ${err}`
    log.w(mod, fun, err)
    throw err
  }
}

exports.verifyPortalToken = (accessToken) => {
  const fun = 'verifyPortalToken'
  log.d(mod, fun, ``)

  try {
    if (!accessToken) throw new BadRequestError('No token to verify!')
    const [jwtHeaderBase64, jwtPayloadBase64, jwtSignatureBase64] = accessToken.split('.')

    // Check JWT header
    const jwtHeader = JSON.parse(utils.decodeBase64url(jwtHeaderBase64))

    // Check JWT body
    const jwtPayload = JSON.parse(utils.decodeBase64url(jwtPayloadBase64))

    const login = portal.getCredentials()[0]
    if (jwtPayload[portal.JWT_USER] !== login) {
      log.w(mod, fun, `Portal JWT: incorrect user: : ${jwtPayload[portal.JWT_USER]}`)
      throw new ForbiddenError(`Portal JWT: incorrect user`)
    }
    // if (jwtPayload[portal.JWT_CLIENT] !== login)
    //   throw new ForbiddenError('Portal JWT: incorrect client')

    if (jwtPayload[portal.JWT_EXP] < utils.nowEpochS())
      throw new ForbiddenError(
        `Portal JWT expired: ` +
          `expire_date=${utils.dateEpochSToIso(jwtPayload[portal.JWT_EXP])}` +
          ` < now=${utils.dateEpochSToIso(utils.nowEpochS())}`
      )
    // log.d(mod, fun, `jwtHeader: ${utils.beautify(jwtHeader)}`)
    // log.d(mod, fun, `jwtPayload: ${utils.beautify(jwtPayload)}`)

    // Check JWT signature
    if (!this.checkSignatureWithPubKey(accessToken))
      throw new ForbiddenError('Portal JWT signature is not valid')

    return [jwtHeader, jwtPayload]
  } catch (err) {
    const errMsg = `Invalid token: ${err}`
    log.w(mod, fun, errMsg)
    throw err
  }
}

// -----------------------------------------------------------------------------
// Portal calls: metadata
// -----------------------------------------------------------------------------

exports.postMetadataToPortal = async (metadataId) => {
  const fun = 'postMetadataToPortal'
  log.d(mod, fun, ``)
  try {
    if (!metadataId) throw new NotImplementedError('Not yet implemented')

    const metadata = await db.getEnsuredObjectWithRudiId(api.PARAM_OBJECT_METADATA, metadataId)
    if (!metadata) {
      const errMsg = `No data found locally for id '${metadataId}'`
      log.w(mod, fun, errMsg)
      throw new NotFoundError(errMsg)
    }
    const metadataClean = utils.deepClone(metadata)

    // delete metadataClean[API_GEOGRAPHY_PROPERTY][API_GEO_GEOJSON_PROPERTY] //
    // metadataClean[API_METAINFO_PROPERTY][API_METAINFO_VERSION_PROPERTY] = 'v1'

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
    if (!metadataId) throw new NotImplementedError('Not yet implemented on Portal side') // Can't get the resouces list yet.

    const token = await this.getPortalToken()
    const reply = await httpGet(portal.getPortalMetaUrl(metadataId), token)

    return reply
  } catch (err) {
    log.w(mod, fun, err)
    throw err
  }
}

exports.deletePortalMetadata = async (metadataId) => {
  const fun = 'deletePortalMetadata'
  log.d(mod, fun, ``)
  try {
    if (!metadataId) throw new BadRequestError('Metadata id required') // Can't get the resouces list yet.

    const token = await this.getPortalToken()
    const portalDeleteUrl = portal.API_SEND_URL + '/' + metadataId
    const reply = await httpDelete(portalDeleteUrl, token)
    // const reply = await httpDelete(portal.getPortalMetaUrl(metadataId), token)

    return reply
  } catch (err) {
    log.e(mod, fun, `Couldn't delete on Portal side: ${err}`)
    return false
  }
}
