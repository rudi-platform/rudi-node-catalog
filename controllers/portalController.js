/* eslint-disable quote-props */

const mod = 'portalCtrl'

// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import { parseKey } from 'sshpk'
import axios from 'axios'
import https from 'node:https'

// -------------------------------------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------------------------------------
import { extractJwt, JWT_EXP, REQ_MTD } from '../utils/crypto.js'
import {
  API_METAINFO_VERSION_PROPERTY,
  API_METAINFO_PROPERTY,
  API_COLLECTION_TAG,
  getUpdatedDate,
} from '../db/dbFields.js'
// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { logD, logI, logT, logV, logW } from '../utils/logging.js'
import { API_VERSION, OBJ_METADATA, PARAM_ID, USER_AGENT } from '../config/confApi.js'
import {
  beautify,
  dateEpochSToIso,
  decodeBase64,
  decodeBase64url,
  deepClone,
  nowEpochS,
  padWithEqualSignBase4,
  toBase64,
} from '../utils/jsUtils.js'
import { accessProperty, accessReqParam } from '../utils/jsonAccess.js'

import { httpGet, httpPost, httpDelete, directPost, directGet, httpPut } from '../utils/httpReq.js'
import {
  FIELD_TOKEN,
  getAuthUrl,
  getCheckAuthUrl,
  getCredentials,
  getPortalMetaUrl,
  getPortalJwtPubKeyUrl,
  isPortalConnectionDisabled,
  JWT_USER,
  PARAM_TOKEN,
  postPortalMetaUrl,
  getPortalCryptPubUrl,
} from '../config/confPortal.js'

import { isUUID } from '../definitions/schemaValidators.js'
import {
  getEnsuredObjectWithRudiId,
  getLatestStoredPortalToken,
  storePortalToken,
} from '../db/dbQueries.js'

import {
  NotFoundError,
  InternalServerError,
  NotImplementedError,
  BadRequestError,
  ForbiddenError,
  NotAcceptableError,
  RudiError,
  UnauthorizedError,
} from '../utils/errors.js'
// -------------------------------------------------------------------------------------------------
// Portal auth header
// -------------------------------------------------------------------------------------------------
const portalHttpsAgent = new https.Agent({
  rejectUnauthorized: false,
})

export const getPortalAuthHeaderBasic = () => {
  const fun = 'getPortalAuthHeaderBasic'
  try {
    logT(mod, fun, ``)
    const [usr, pwdb64] = getCredentials()
    const pwd = decodeBase64(pwdb64)
    const basicAuth = padWithEqualSignBase4(toBase64(`${usr}:${pwd}`))
    return {
      headers: {
        'User-Agent': USER_AGENT,
        Authorization: `Basic ${basicAuth}`,
      },
    }
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}
export const getPortalAuthHeaderBearer = async () => {
  const fun = 'getPortalAuthHeaderBearer'
  try {
    logT(mod, fun, ``)
    return {
      headers: {
        'User-Agent': USER_AGENT,
        Authorization: `Bearer ${await getPortalToken()}`,
      },
    }
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

// -------------------------------------------------------------------------------------------------
// Token manager
// -------------------------------------------------------------------------------------------------
// import { RMTokenManager } from '../definitions/constructors/RMTokenManager'
// const portalInfo = {
//   host: API_GET_HOST,
//   port: API_GET_PORT,
//   path_request: API_GET_PATH,
//   path_check: API_SEND_PATH,
//   login: LOGIN,
//   passw: PASSW,
// }
// const agent = `RUDI/${VERSION}`

// const tokenManager = new RMTokenManager(portalInfo, agent)

// -------------------------------------------------------------------------------------------------
// REST access
// -------------------------------------------------------------------------------------------------
export const exposedGetPortalToken = async (req, reply) => {
  const fun = 'exposedGetPortalToken'
  logT(mod, fun, `< GET new portal token`)
  try {
    // logD(mod, fun, getAuthUrl())
    return await getNewTokenFromPortal()
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

export const checkPortalTokenInHeader = async (req, isCheckOptional) => {
  const fun = 'checkPortalTokenInHeader'
  logT(mod, fun, ``)
  try {
    const token = extractJwt(req)
    const jwtInfo = await verifyPortalToken(token)
    return jwtInfo
    // return await getTokenCheckedByPortal(token)
  } catch (err) {
    if (isCheckOptional) throw err
    const error = new UnauthorizedError(err)
    throw RudiError.treatError(mod, fun, error)
  }
}

// -------------------------------------------------------------------------------------------------
// Controllers
// -------------------------------------------------------------------------------------------------

/**
 * Get a new token from the portal
 */
export const getPortalToken = async () => {
  const fun = 'getPortalToken'
  logT(mod, fun, ``)
  let token, rmToken
  try {
    rmToken = await getLatestStoredPortalToken()
    if (!rmToken || rmToken.expires_in < nowEpochS()) {
      logD(mod, fun, 'Need for a new portal token')
      rmToken = await getNewTokenFromPortal()
    }

    token = accessProperty(rmToken, FIELD_TOKEN)
    // logD(mod, fun, `token: ${ beautify(token)}`)
    await verifyPortalToken(token)
    logD(mod, fun, 'Stored token seems OK')

    await getTokenCheckedByPortal(token)
    return token
    // logD(mod, fun, 'Stored token was validated by the Portal')
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
    //  new InternalServerError(`Failed to get a new token from the portal: ${err}`)
  }
}

/**
 * Ensure a token is valid
 */
export const checkStoredToken = async (req, reply) => {
  const fun = 'checkStoredToken'
  logT(mod, fun, ``)
  // logT(mod, fun, `< GET portal check token`)
  try {
    const token = await getLatestStoredPortalToken()
    if (!token) throw new NotFoundError('No Portal token is actually stored')
    return await getTokenCheckedByPortal(token[FIELD_TOKEN])
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

export const checkInputToken = async (req, reply) => {
  const fun = 'checkInputToken'
  logT(mod, fun, ``)
  try {
    const token = accessReqParam(req.params, PARAM_TOKEN)
    return await getTokenCheckedByPortal(token[FIELD_TOKEN])
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

export const getMetadata = async (req, reply) => {
  const fun = 'getMetadata'
  logT(mod, fun, ``)
  try {
    let metadataId = req.params[PARAM_ID]
    logD(mod, fun, `metadataId: ${metadataId}`)
    if (metadataId && !isUUID(metadataId)) metadataId = null

    return await getMetadataFromPortal(metadataId)
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

export const sendMetadata = async (req, reply) => {
  const fun = 'sendMetadata'
  logT(mod, fun, ``)
  try {
    let metadataId = req.params[PARAM_ID]
    logD(mod, fun, `metadataId: ${metadataId}`)
    if (!metadataId || !isUUID(metadataId))
      throw new BadRequestError('Parameter is not a valid UUID v4')

    return await sendMetadataToPortal(metadataId)
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

export const deleteMetadata = async (req, reply) => {
  const fun = 'deleteMetadata'
  logT(mod, fun, ``)
  try {
    let metadataId = req.params[PARAM_ID]
    logD(mod, fun, `metadataId: ${metadataId}`)
    if (metadataId && !isUUID(metadataId)) metadataId = null

    return await deletePortalMetadata(metadataId)
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}
// -------------------------------------------------------------------------------------------------
// Portal calls: GET public key
// -------------------------------------------------------------------------------------------------
let cachedPortalJwtPubKey
// ----- GET Portal public key
export const getPortalJwtPubKey = async () => {
  const fun = 'getPortalJwtPubKey'
  try {
    logT(mod, fun, ``)
    if (cachedPortalJwtPubKey) return cachedPortalJwtPubKey

    const publicKeyUrl = getPortalJwtPubKeyUrl()
    logD(mod, fun, 'publicKeyUrl: ' + publicKeyUrl)

    const publicKeyObj = await axios.get(publicKeyUrl, getPortalAuthHeaderBasic())
    logD(mod, fun, 'publicKeyObj: ' + beautify(publicKeyObj))
    cachedPortalJwtPubKey = publicKeyObj?.data?.value
    logD(mod, fun, `portalJwtPubKey: ${cachedPortalJwtPubKey}`)
    return cachedPortalJwtPubKey
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

let cachedPortalEncryptPubKey
export const getPortalEncryptPubKey = async () => {
  const fun = 'getPortalEncryptPubKey'
  try {
    logT(mod, fun, ``)
    // if (cachedPortalEncryptPubKey) return cachedPortalEncryptPubKey

    // cachedPortalEncryptPubKey = await axiosInstanceForPortal.get(getPortalCryptPubUrl())
    const portalCryptPubData = await axios.get(getPortalCryptPubUrl(), {
      headers: {
        'User-Agent': USER_AGENT,
        Authorization: `Bearer ${await getPortalToken()}`,
      },
      httpsAgent: portalHttpsAgent,
    })
    cachedPortalEncryptPubKey = portalCryptPubData?.data
    // logD(mod, fun, `portalEncryptPubKey: ${beautify(cachedPortalEncryptPubKey)}`)
    return cachedPortalEncryptPubKey
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}
// -------------------------------------------------------------------------------------------------
// Portal calls: token
// -------------------------------------------------------------------------------------------------
export const getNewTokenFromPortal = async () => {
  const fun = 'getNewTokenFromPortal'
  try {
    logT(mod, fun, ``)
    const [usr, pwdb64] = getCredentials()
    const pwd = decodeBase64(pwdb64)

    const portalAuthUrl = getAuthUrl()
    // LM -- the password is now provided in base64
    // logD(mod, fun, `pwdb64: ${pwdb64}`)
    // logD(mod, fun, `pwd: ${pwd}`)
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
    let answer
    try {
      answer = await directPost(portalAuthUrl, body, getPortalAuthHeaderBasic())
    } catch (err) {
      if (RudiError.isRudiError(err)) throw RudiError.treatError(mod, fun, err)
      else {
        const error = new InternalServerError(`Post to portal failed: ${beautify(err)}`)
        throw RudiError.treatError(mod, fun, error)
      }
    }
    // logD(mod, fun, `answer.status: ${answer.status}`)

    if (answer.status === 200) {
      // logD(mod, fun, `config: ${ beautify(answer.config)}`)
      // logD(mod, fun, `data: ${ beautify(answer.data)}`)
      const portalToken = answer.data

      const jwToken = portalToken[FIELD_TOKEN]
      if (typeof portalToken !== 'object' || !portalToken[FIELD_TOKEN])
        throw new NotAcceptableError(`The portal delivered an incorrect reply: ${portalToken}`)

      // logD(mod, fun, `portalToken: ${ beautify(portalToken)}`)

      const jwtBody = (await verifyPortalToken(jwToken))[1]
      portalToken[JWT_EXP] = jwtBody[JWT_EXP]
      logD(mod, fun, `We got a new token, that expires on ${dateEpochSToIso(jwtBody[JWT_EXP])}`)
      await getTokenCheckedByPortal(portalToken[FIELD_TOKEN])
      await storePortalToken(portalToken)

      return portalToken
    } else {
      const errMsg = `${beautify(answer)}`
      // logW(mod, fun, errMsg)
      throw RudiError.createRudiHttpError(answer.status, errMsg, mod, fun)
    }
  } catch (err) {
    if (RudiError.isRudiError(err)) {
      logT(mod, fun, 'is a RudiError')
      throw RudiError.treatError(mod, fun, err)
    } else {
      logT(mod, fun, `is not a RudiError: ${err}`)
      const error = new ForbiddenError(`Failed to get a token from Portal: ${beautify(err)}`)
      throw RudiError.treatError(mod, fun, error)
    }
  }
}

export const getTokenCheckedByPortal = async (token) => {
  const fun = 'getTokenCheckedByPortal'
  try {
    logT(mod, fun, ``)
    if (!token) throw new BadRequestError('No token to check!')
    const portalUrl = getCheckAuthUrl()

    const requestUrl = `${portalUrl}?${PARAM_TOKEN}=${token}`
    // logD(mod, fun, requestUrl)
    const portalResponse = await directGet(requestUrl)

    if (portalResponse.status === 200) {
      logV(mod, fun, `RUDI Portal validated the token`)
      return portalResponse.data
    } else throw new ForbiddenError(`Portal invalidated the token: ${portalResponse.data}`)
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
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
  roles: ['admin', 'editor']         // Autorisations de l'utilisateur
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
/* 
  export const checkSignatureWithSecret = (accessToken) => {
    const fun = 'checkSignatureWithSecret'
    logT(mod, fun, ``)

    try {
      if (!accessToken) throw new BadRequestError('No token = no signature to verify!')
      const [jwtHeaderBase64, jwtPayloadBase64, jwtSignatureBase64] = accessToken.split('.')

      const hash = createHmac('sha256', getSecret())
        .update(`${jwtHeaderBase64}.${jwtPayloadBase64}`)
        .digest('base64url')

      if (hash !== jwtSignatureBase64) {
        const errMsg = `Forged token? Computed hash: ${hash} != jwt signature: ${jwtSignatureBase64}`
        logW(mod, fun, errMsg)
      }
      return hash === jwtSignatureBase64

      // if (hash !== jwtSignatureBase64) {
      //   const errMsg = `Forged token? Computed hash: ${hash} != jwt signature: ${jwtSignatureBase64}`
      //   logW(mod, fun, errMsg)
      //   throw new Error(errMsg)
      // }
      // return true
    } catch (err) {
      const errMsg = `Invalid token: ${err}`
      logW(mod, fun, errMsg)
      throw err
    }
  }
 */
export const checkSignatureWithPubKey = async (accessToken) => {
  const fun = 'checkSignatureWithPubKey'
  try {
    logT(mod, fun, ``)

    if (!accessToken) throw new BadRequestError('No token = no signature to check!')
    const [jwtHeaderBase64url, jwtPayloadBase64url, jwtSignatureBase64url] = accessToken.split('.')

    // Retrieve the public key
    let pubKeyPem
    try {
      pubKeyPem = await getPortalJwtPubKey()
    } catch (err) {
      throw new InternalServerError(`Couldn't retrieve online portal public key: ${err}`)
    }
    let sslKey
    try {
      sslKey = parseKey(pubKeyPem)
    } catch (err) {
      throw new InternalServerError(
        `The Portal public key is incorrect, please check the content: ${err}`
      )
    }

    // logD(mod, fun, `sslKey: ${ beautify(sslKey)}`)
    // const keyName = sslKey.comment && sslKey.comment !== '(unnamed)' ? `'${sslKey.comment}' ` : ''
    // logD(mod, fun, `${keyName}public key: ${sslKey.type} ${sslKey.size} bits`)
    let signatureIsValid
    try {
      const verifier = sslKey.createVerify('sha256')
      verifier.update(`${jwtHeaderBase64url}.${jwtPayloadBase64url}`)
      signatureIsValid = verifier.verify(jwtSignatureBase64url, 'base64url')
    } catch (err) {
      throw new ForbiddenError(`Error while verifying the Portal token signature: ${err}`)
    }
    if (signatureIsValid) {
      logI(mod, fun, `signature is valid`)
    } else {
      logW(mod, fun, `signature is not valid`)
    }
    return signatureIsValid
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

export const verifyPortalToken = async (accessToken) => {
  const fun = 'verifyPortalToken'
  logT(mod, fun, ``)

  try {
    if (!accessToken) throw new BadRequestError('No token to verify!')
    const [jwtHeaderBase64, jwtPayloadBase64, _] = accessToken.split('.')

    // Check JWT header
    const jwtHeader = JSON.parse(decodeBase64url(jwtHeaderBase64))

    // Check JWT body
    const jwtPayload = JSON.parse(decodeBase64url(jwtPayloadBase64))

    const jwtPortalUser = jwtPayload[JWT_USER]
    if (!jwtPortalUser && jwtPayload[REQ_MTD])
      throw new ForbiddenError(`Using a RUDI internal JWT to access a Portal route is incorrect.`)
    /*
      // const login = getCredentials()[0]
      // logD(mod, fun, `JWT Portal payload: ${ beautify(jwtPayload)}`)
      // logD(mod, fun, `JWT Portal user: ${jwtPortalUser}`)
      if (jwtPortalUser !== login) {
        // logW(mod, fun, `Portal JWT: incorrect user: ${jwtPortalUser}`)
        logE(`Portal JWT: incorrect user: ${jwtPortalUser}, token=${accessToken}`)
        // throw new ForbiddenError(`Portal JWT: incorrect user`)
      }
      // if (jwtPayload[JWT_CLIENT] !== login)
      //   throw new ForbiddenError('Portal JWT: incorrect client')
    */
    if (jwtPayload[JWT_EXP] < nowEpochS())
      throw new ForbiddenError(
        `Portal JWT expired: ` +
          `expire_date=${dateEpochSToIso(jwtPayload[JWT_EXP])}` +
          ` < now=${dateEpochSToIso(nowEpochS())}`
      )
    // logD(mod, fun, `jwtHeader: ${ beautify(jwtHeader)}`)
    // logD(mod, fun, `jwtPayload: ${ beautify(jwtPayload)}`)

    // Check JWT signature
    if (!(await checkSignatureWithPubKey(accessToken)))
      throw new ForbiddenError('Portal JWT signature is not valid')

    // logD(mod, fun, `jwtHeader: ${ beautify(jwtHeader)}`)
    // logD(mod, fun, `jwtPayload: ${ beautify(jwtPayload)}`)
    return [jwtHeader, jwtPayload]
  } catch (err) {
    const errMsg = `Invalid token: ${err}`
    logW(mod, fun, errMsg)
    throw RudiError.treatError(mod, fun, err)
  }
}

// -------------------------------------------------------------------------------------------------
// Portal calls: metadata
// -------------------------------------------------------------------------------------------------
export const sendMetadataToPortal = async (metadataId) => {
  const fun = 'sendMetadataToPortal'
  try {
    logT(mod, fun, ``)
    if (isPortalConnectionDisabled()) return

    //--- Check input param
    if (!metadataId) throw new NotImplementedError('Not yet implemented')
    if (!isUUID(metadataId)) throw new BadRequestError(`Bad formatted UUID: ${metadataId}`)

    //--- Get local metadata from ID
    const metadata = await getEnsuredObjectWithRudiId(OBJ_METADATA, metadataId)
    if (!metadata) {
      const errMsg = `No data found locally for id '${metadataId}'`
      logW(mod, fun, errMsg)
      throw new NotFoundError(errMsg)
    }

    //--- If 'collection_tag' is set (ie for tests), metadata is not sent
    const collectionTag = metadata[API_COLLECTION_TAG]
    if (collectionTag) {
      logD(mod, fun, `Not sending to portal: ${metadataId} (${collectionTag})`)
      return
    }

    //--- Ensuring compatibility with portal
    const metadataClean = deepClone(metadata)
    // API version
    metadataClean[API_METAINFO_PROPERTY][API_METAINFO_VERSION_PROPERTY] = API_VERSION
    // MIME type: YAML
    // metadataClean[API_MEDIA_PROPERTY].map((media) => {
    //   if (media[API_MEDIA_TYPE] === MediaTypes.File && media[API_FILE_TYPE] === MIME_YAML) {
    //     media[API_FILE_TYPE] = 'text/plain'
    //   }
    // })

    // logD(mod, fun, beautify(metadataClean))

    //--- Sending to portal
    const sendPortalUrl = postPortalMetaUrl()
    const portalToken = await getPortalToken()
    const reqOpts = {
      headers: {
        'User-Agent': USER_AGENT,
        'Content-Type': 'application/json',
        Authorization: `Bearer ${portalToken}`,
      },
    }
    try {
      logD(mod, fun, `Checking if the metadata is on the portal`)
      const answer = await axios.get(getPortalMetaUrl(metadataId), reqOpts)
      const portalMetadata = answer.data

      if (getUpdatedDate(portalMetadata) < getUpdatedDate(metadataClean)) {
        logD(mod, fun, `Metadata is on the portal and older: updating '${metadataId}'`)
        return httpPut(sendPortalUrl, metadataClean, portalToken)
      } else {
        logD(mod, fun, `Metadata is on the portal and same: not updating '${metadataId}'`)
      }
    } catch (err) {
      logV(mod, fun, err)
      logD(mod, fun, `Metadata is not on the portal: sending '${metadataId}'`)
      return httpPost(sendPortalUrl, metadataClean, portalToken)
    }
    // logD(mod, fun, `reply: ${ beautify(reply)}`)
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

export const getMetadataFromPortal = async (metadataId) => {
  const fun = 'getMetadataFromPortal'
  logT(mod, fun, ``)
  try {
    const token = await getPortalToken()

    if (!metadataId) return httpGet(getPortalMetaUrl(), token)
    else return httpGet(getPortalMetaUrl(metadataId), token)
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

export const deletePortalMetadata = async (metadataId) => {
  const fun = 'deletePortalMetadata'
  logT(mod, fun, ``)
  try {
    if (!metadataId) throw new BadRequestError('Metadata id required') // Can't get the resouces list yet.

    const token = await getPortalToken()
    const reply = await httpDelete(postPortalMetaUrl(metadataId), token)

    return reply
  } catch (err) {
    const error = new Error(`Couldn't delete on Portal side: ${err}`)
    throw RudiError.treatError(mod, fun, error)
  }
}
