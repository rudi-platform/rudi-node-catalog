// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import { extractJwt, tokenStringToJwtObject, verifyToken } from '@aqmo.org/jwt-lib'
import axios from 'axios'
import https from 'node:https'

import _ from 'lodash'
// -------------------------------------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------------------------------------
import { OBJ_METADATA, OBJ_ORGANIZATIONS, PARAM_ID, USER_AGENT } from '../config/constApi.js'
import {
  API_COLLECTION_TAG,
  API_DATA_NAME_PROPERTY,
  API_DATES_PUBLISHED,
  API_METADATA_ID,
  API_METAINFO_DATES,
  API_METAINFO_PROPERTY,
  API_ORGANIZATION_ID,
  API_ORGANIZATION_NAME,
  API_ORGANIZATION_ADDRESS,
  API_ORGANIZATION_COORDINATES,
  API_ORGANIZATION_SUMMARY,
  API_ORGANIZATION_VALIDATION_STATUS,
  API_ORGANIZATION_ATTACHMENT_STATUS,
  API_REPORT_ID,
  API_STATUS_PROPERTY,
  API_STORAGE_STATUS,
  DB_UPDATED_AT,
  getUpdatedDate,
  MetadataStatus,
} from '../db/dbFields.js'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { JWT_EXP, REQ_MTD } from '../config/constJwt.js'
import { beautify, dateEpochSToIso, nowISO, sleepMs, timeEpochS } from '../utils/jsUtils.js'
import { logD, logE, logI, logT, logV, logW } from '../utils/logging.js'

import {
  defaultPortalRequestOptions,
  FIELD_TOKEN,
  getPortalAuthCredentials,
  getPortalAuthHeaders,
  getPortalMetaUrl,
  getPortalOrganizationUrl,
  getUrlPortalAuthCheck,
  getUrlPortalAuthGet,
  getUrlPortalAuthPub,
  getUrlPortalEncryptPub,
  isPortalConnectionDisabled,
  JWT_USER,
  linkedProducerHasTaskUrl,
  NO_PORTAL_MSG,
  organizationAttachRequestUrl,
  postPortalMetaUrl,
} from '../config/confPortal.js'
import { directPost, httpDelete, httpGet, httpPost, httpPut } from '../utils/httpReq.js'

import { isUUID } from '../definitions/schemaValidators.js'
import { StorageStatus } from '../definitions/thesaurus/StorageStatus.js'

import { getDbObjectList, getObjectWithRudiId } from '../db/dbQueries.js'

import { createPublicKey } from 'node:crypto'
import { isEveryMediaAvailable, setMetadataStatusToSent } from '../definitions/models/Metadata.js'
import { ObjectTypes } from '../definitions/models/Report.js'
import Organization, {
  OrganizationStatus,
  LinkedProducerStatus,
} from '../definitions/models/Organization.js'
import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  NotAcceptableError,
  NotFoundError,
  RudiError,
  UnauthorizedError,
} from '../utils/errors.js'
import { createErrorReport } from './reportController.js'

const mod = 'portalCtrl'

const { pick } = _

// -------------------------------------------------------------------------------------------------
// Portal auth header
// -------------------------------------------------------------------------------------------------
const portalHttpsAgent = new https.Agent({ rejectUnauthorized: false })

export const getPortalAuthHeaderBearer = async (httpsAgent) => {
  const fun = 'getPortalAuthHeaderBearer'
  logT(mod, fun)
  if (isPortalConnectionDisabled()) return NO_PORTAL_MSG

  try {
    const portalToken = await getPortalToken()
    return {
      headers: { 'User-Agent': USER_AGENT, Authorization: `Bearer ${portalToken}` },
      httpsAgent,
    }
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

// -------------------------------------------------------------------------------------------------
// Controllers
// -------------------------------------------------------------------------------------------------

export const updateOrganizationFromPortal = async (req, reply) => {
  const fun = 'getPortalOrganization'
  logT(mod, fun)
  if (isPortalConnectionDisabled()) return NO_PORTAL_MSG

  try {
    // If Portal is not configured, no request should be made

    const portalOrganization = await getPortalOrganization(req, reply)
    const isAttached = await isOrganizationAttached(req, reply)

    logT(mod, fun, portalOrganization)

    if (portalOrganization) {
      const organization = await getObjectWithRudiId(OBJ_ORGANIZATIONS, req.params[PARAM_ID])
      logT(mod, fun, portalOrganization, organization)
      if (organization) {
        updateOrganization(organization, portalOrganization, isAttached)

        organization.save()
      }
    }
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

export const getPortalOrganization = async (req, reply) => {
  const fun = 'getPortalOrganizationAsync'
  logT(mod, fun)
  if (isPortalConnectionDisabled()) return NO_PORTAL_MSG

  try {
    let organizationId = req.params[PARAM_ID]
    if (organizationId && !isUUID(organizationId)) organizationId = undefined
    if (organizationId) logD(mod, fun, `organizationId: ${organizationId}`)
    logI(mod, fun, `organizationId: ${organizationId}`)

    const additionalParameters = req.url?.split('?')[1]
    return await httpGet(
      getPortalOrganizationUrl(organizationId, additionalParameters),
      await getPortalToken(),
      defaultPortalRequestOptions()
    )
  } catch (err) {
    // if (err.statusCode == 404) return null
    throw RudiError.treatError(mod, fun, err)
  }
}

export const searchOrganizationsInPortal = async (req, reply) => {
  const fun = 'getOrganizationsFromPortal'
  logT(mod, fun)
  if (isPortalConnectionDisabled()) return NO_PORTAL_MSG

  try {
    const additionalParameters = req.url?.split('?')[1]
    logI(mod, fun, `additionalParameters: ${additionalParameters}`)

    return await httpGet(
      getPortalOrganizationUrl('', additionalParameters),
      await getPortalToken(),
      defaultPortalRequestOptions()
    )
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

export const createPortalOrganization = async (organization) => {
  const fun = 'createPortalOrganization'
  logT(mod, fun)
  if (isPortalConnectionDisabled()) return NO_PORTAL_MSG

  if (!organization) throw new BadRequestError('Input organization should be defined')

  try {
    return await httpPost(
      getPortalOrganizationUrl(),
      organization,
      await getPortalToken(),
      defaultPortalRequestOptions()
    )
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

export const isOrganizationAttached = async (req, reply) => {
  const fun = 'isOrganizationAttached'
  logT(mod, fun)
  if (isPortalConnectionDisabled()) return NO_PORTAL_MSG

  try {
    const organizationId = req.params?.[PARAM_ID]
    if (!organizationId) throw new BadRequestError(`Organization UUID is empty`)
    if (!isUUID(organizationId))
      throw new BadRequestError(`Organization UUID is invalid: ${organizationId}`)
    logI(mod, fun, `organizationId: ${organizationId}`)

    return await httpGet(
      organizationAttachRequestUrl(organizationId),
      await getPortalToken(),
      defaultPortalRequestOptions()
    )
  } catch (err) {
    // if (err.statusCode == 404) return null
    throw RudiError.treatError(mod, fun, err)
  }
}

const ensureOrganizationFromPortalData = async (organizationId, portalOrgData) => {
  const fun = 'ensureOrganizationFromPortalData'
  logT(mod, fun, `organizationId: ${organizationId}`)

  try {
    if (!organizationId || !portalOrgData) {
      logW(mod, fun, `Missing organizationId or portalOrgData`)
      return null
    }

    // Check whether the organization already exists locally
    let localOrganization = await getObjectWithRudiId(OBJ_ORGANIZATIONS, organizationId)

    if (localOrganization) {
      // Organization exists: update statuses
      logI(mod, fun, `Organization exists locally. Updating status for ID: ${organizationId}`)
      localOrganization[API_ORGANIZATION_VALIDATION_STATUS] = OrganizationStatus.VALIDATED
      localOrganization[API_ORGANIZATION_ATTACHMENT_STATUS] = LinkedProducerStatus.IN_PROGRESS
      await localOrganization.save()
      logI(mod, fun, `Organization status updated: ${organizationId}`)
      return localOrganization
    }

    // Organization does not exist: create it from Portal data
    logI(mod, fun, `Creating new organization from Portal data. ID: ${organizationId}`)

    const organizationData = {
      [API_ORGANIZATION_ID]: organizationId,
      [API_ORGANIZATION_NAME]: portalOrgData.organization_name,
      [API_ORGANIZATION_VALIDATION_STATUS]: OrganizationStatus.VALIDATED,
      [API_ORGANIZATION_ATTACHMENT_STATUS]: LinkedProducerStatus.IN_PROGRESS,
    }

    // Add optional fields when present
    if (portalOrgData.organization_summary) {
      organizationData[API_ORGANIZATION_SUMMARY] = portalOrgData.organization_summary
    }
    if (portalOrgData.organization_address) {
      organizationData[API_ORGANIZATION_ADDRESS] = portalOrgData.organization_address
    }
    if (portalOrgData.organization_coordinates) {
      organizationData[API_ORGANIZATION_COORDINATES] = portalOrgData.organization_coordinates
    }

    const newOrganization = new Organization(organizationData)
    await newOrganization.save()
    logI(mod, fun, `New organization created successfully: ${organizationId}`)
    return newOrganization
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

export const attachOrganization = async (req, reply) => {
  const fun = 'attachOrganization'
  logT(mod, fun)
  if (isPortalConnectionDisabled()) return NO_PORTAL_MSG
  try {
    const organizationId = req.params?.[PARAM_ID]
    if (!organizationId) throw new BadRequestError(`Organization UUID is empty`)
    if (!isUUID(organizationId))
      throw new BadRequestError(`Organization UUID is invalid: ${organizationId}`)
    logI(mod, fun, `organizationId: ${organizationId}`)

    // Request the attach action on Portal
    const attachResult = await httpPost(
      organizationAttachRequestUrl(organizationId),
      req.body,
      await getPortalToken(),
      defaultPortalRequestOptions()
    )

    // After a successful attach, fetch organization data from Portal
    logD(mod, fun, `Fetch organization data from Portal for: ${organizationId}`)
    const portalOrgData = await httpGet(
      getPortalOrganizationUrl(organizationId),
      await getPortalToken(),
      defaultPortalRequestOptions()
    )

    // Create or update the local organization
    if (portalOrgData) {
      await ensureOrganizationFromPortalData(organizationId, portalOrgData)
    }

    return attachResult
  } catch (err) {
    // if (err.statusCode == 404) return null
    throw RudiError.treatError(mod, fun, err)
  }
}

export const detachOrganization = async (req, reply) => {
  const fun = 'detachOrganization'
  logT(mod, fun)
  if (isPortalConnectionDisabled()) return NO_PORTAL_MSG
  try {
    const organizationId = req.params?.[PARAM_ID]
    if (!organizationId) throw new BadRequestError(`Organization UUID is empty`)
    if (!isUUID(organizationId))
      throw new BadRequestError(`Organization UUID is invalid: ${organizationId}`)
    logI(mod, fun, `organizationId: ${organizationId}`)

    try {
      const result = await httpDelete(
        organizationAttachRequestUrl(organizationId),
        await getPortalToken()
      )
      // Refresh the local organization status from portal after successful detach
      await updateOrganizationFromPortal(req, reply)
      return result
    } catch (err) {
      // 409 means a task is already pending — propagate as-is so the front can display a warning
      if (err?.statusCode === 409) throw RudiError.createRudiHttpError(409, err.message, mod, fun)
      throw err
    }
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

export const linkedProducerHasTask = async (req, reply) => {
  const fun = 'linkedProducerHasTask'
  logT(mod, fun)
  if (isPortalConnectionDisabled()) return NO_PORTAL_MSG
  try {
    let organizationId = req.params[PARAM_ID]
    if (organizationId && !isUUID(organizationId)) {
      organizationId = undefined
    }
    if (organizationId) {
      logD(mod, fun, `organizationId: ${organizationId}`)
    }

    logI(mod, fun, `organizationId: ${organizationId}`)
    try {
      return await httpGet(linkedProducerHasTaskUrl(organizationId), await getPortalToken())
    } catch (err) {
      // 404 means no pending task for this organization — return false instead of throwing
      if (err?.statusCode === 404) return false
      throw err
    }
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

export const getPortalMetadata = async (req, reply) => {
  const fun = 'getPortalMetadata'
  logT(mod, fun)
  try {
    if (isPortalConnectionDisabled()) return NO_PORTAL_MSG
    let metadataId = req.params[PARAM_ID]
    if (metadataId && !isUUID(metadataId)) metadataId = undefined
    if (metadataId) logD(mod, fun, `metadataId: ${metadataId}`)

    const additionalParameters = req.url?.split('?')[1]

    return await getMetadataFromPortal(metadataId, additionalParameters)
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

export const sendMetadata = async (req, reply) => {
  const fun = 'sendMetadata'
  logT(mod, fun)
  try {
    if (isPortalConnectionDisabled()) return NO_PORTAL_MSG
    let metadataId = req.params[PARAM_ID]
    logD(mod, fun, `metadataId: ${metadataId}`)
    if (!metadataId || !isUUID(metadataId))
      throw new BadRequestError('Parameter is not a valid UUID v4')

    return await sendMetadataToPortal(metadataId)
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

export const sendAllMetadataToPortal = async (req, reply) => {
  const fun = 'sendAllMetadataToPortal'
  logT(mod, fun)
  try {
    if (isPortalConnectionDisabled()) return NO_PORTAL_MSG
    const status = req.query?.metadata_status || MetadataStatus.Sent
    const msg = `Sending all the metadata with status = ${status}`
    logD(mod, fun, msg)
    const metadataList = await getDbObjectList(OBJ_METADATA, { metadata_status: status })
    const metaCount = metadataList.length
    logD(mod, fun, `${metaCount} metadata impacted`)
    await getPortalToken()
    const bucketLen = 5
    // const delay = 200
    const bucketCount = Math.ceil(metaCount / bucketLen)

    for (let n = 0; n < bucketCount; n++) {
      for (let i = 0; i < bucketLen && bucketLen * n + i < metaCount; i++) {
        const meta = metadataList[bucketLen * n + i]
        logD(mod, fun, `meta: ${beautify(meta)}`)
        sendMetadataToPortal(metadataList[bucketLen * n + i]?.[API_METADATA_ID])
          .then((res) => logD(mod, fun, `OK: ${beautify(res)}`))
          .catch((err) => logW(mod, fun, `ERR: ${beautify(err)}`))
        sleepMs(50)
      }
    }
    reply.send(msg)
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

export const deleteMetadata = async (req, reply) => {
  const fun = 'deleteMetadata'
  logT(mod, fun)
  try {
    if (isPortalConnectionDisabled()) return NO_PORTAL_MSG
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
// ----- GET Portal public key
const _cachedPortalJwtPubs = {}
export const getPortalJwtPubKey = async (kid) => {
  const fun = 'getPortalJwtPubKey'
  logT(mod, fun)
  try {
    if (isPortalConnectionDisabled()) return NO_PORTAL_MSG
    if (!_cachedPortalJwtPubs[kid]) {
      const portalPubKeysList = await getPortalPubKeys()
      // logV(mod, fun, `publicKeyObj: ${beautify(portalPubKeysList)}`)
      const format = 'jwk'
      for (const key of portalPubKeysList) {
        // logD(mod, fun, `portal key: ${beautify(key)}`)
        const pubKey = createPublicKey({ key, format })
        // const keyPem = pubKey.export({ type: 'pkcs1', format: 'pem' })
        // logV(mod, fun, `keyPem:\n ${beautify(keyPem)}`)
        // logV(mod, fun, `readPublicKeyPem:\n ${beautify(readPublicKeyPem(keyPem))}`)
        _cachedPortalJwtPubs[key.kid] = { key, pubk: pubKey, date: nowISO() }
      }
      // logV(mod, fun, `_cachedPortalJwtPubs: ${beautify(_cachedPortalJwtPubs)}`)
    }
    return _cachedPortalJwtPubs[kid]?.pubk
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

const getPortalPubKeys = async () => {
  const fun = 'getPortalPubKeys'
  logT(mod, fun)
  try {
    if (isPortalConnectionDisabled()) return NO_PORTAL_MSG
    const publicKeyUrl = getUrlPortalAuthPub()
    logD(mod, fun, `publicKeyUrl: ${publicKeyUrl}`)
    const portalPubKeysList = (await axios.get(publicKeyUrl, getPortalAuthHeaders()))?.data?.keys
    return portalPubKeysList
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

let _cachedPortalEncryptPub
export const getPortalEncryptPubKey = async () => {
  const fun = 'getPortalEncryptPubKey'
  logT(mod, fun)
  if (isPortalConnectionDisabled()) return NO_PORTAL_MSG
  if (!_cachedPortalEncryptPub) {
    const portalHeaders = await getPortalAuthHeaderBearer(portalHttpsAgent)
    try {
      _cachedPortalEncryptPub = (await axios.get(getUrlPortalEncryptPub(), portalHeaders))?.data
    } catch (err) {
      logE(mod, fun + '.err', beautify(err, 2))
      logE(mod, fun + '.url', getUrlPortalEncryptPub())
      logE(mod, fun + '.headers', beautify(portalHeaders))
      throw RudiError.treatError(mod, fun, err)
    }
  }
  return _cachedPortalEncryptPub
}
// -------------------------------------------------------------------------------------------------
// Portal calls: token
// -------------------------------------------------------------------------------------------------

let _cachedPortalToken

const updateCachedPortalJwt = async () => {
  const fun = 'updateCachedPortalJwt'
  _cachedPortalToken = await getNewTokenFromPortal()
  return _cachedPortalToken.jwt
}
const getCachedPortalJwt = () => _cachedPortalToken.jwt
const hasExpiredPortalJwt = () => !_cachedPortalToken?.jwt || _cachedPortalToken.exp < timeEpochS()

/**
 * Get a valid portal token
 */
export const getPortalToken = async () => {
  const fun = 'getPortalToken'
  logT(mod, fun)
  try {
    if (isPortalConnectionDisabled()) return NO_PORTAL_MSG
    if (hasExpiredPortalJwt()) {
      if (!_cachedPortalToken?.jwt) logD(mod, fun, 'No portal JWT yet')
      else logD(mod, fun, `Need for a new portal token: (exp = ${_cachedPortalToken?.exp})`)
      return await updateCachedPortalJwt()
    }
    const portalJwt = getCachedPortalJwt()
    // logI(mod, fun, `cached portal JWT=${portalJwt}`)
    const checkRes = await getTokenCheckedByPortal(portalJwt)
    if (!checkRes?.active) return await updateCachedPortalJwt()
    else logD(mod, fun, 'Stored token seems OK')
    return portalJwt
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

/**
 * Renew portal token
 */
const getNewTokenFromPortal = async () => {
  const fun = 'getNewTokenFromPortal'
  logT(mod, fun)
  try {
    if (isPortalConnectionDisabled()) return NO_PORTAL_MSG

    const [basicAuthHeaders, portalRequestBody] = getPortalAuthCredentials()
    const portalAuthUrl = getUrlPortalAuthGet()
    let portalAnswer
    try {
      portalAnswer = await directPost(portalAuthUrl, portalRequestBody, {
        ...defaultPortalRequestOptions(),
        ...basicAuthHeaders,
      })
      // logT(mod, fun, 'OK portal answered')
    } catch (err) {
      logE(mod, fun, `ERR GET portal JWT: ${beautify(err)}`)

      await createErrorReport(err, {
        step: 'posting the node credentials to Portal',
        description: 'An error occurred while getting a new token from the Portal',
        method: 'POST',
        url: portalAuthUrl,
      })
      if (RudiError.isRudiError(err)) throw RudiError.treatError(mod, fun, err)
      else {
        const error = new InternalServerError(`Post to portal failed: ${beautify(err)}`)
        throw RudiError.treatError(mod, fun, error)
      }
    }
    if (portalAnswer?.status === 200) {
      const portalToken = portalAnswer.data
      const jwt = portalToken?.[FIELD_TOKEN]
      if (!jwt)
        throw new NotAcceptableError(`The portal delivered an incorrect reply: ${portalToken}`)

      logT(mod, fun, 'OK we got a new token')
      try {
        await verifyPortalTokenSign(jwt)
      } catch (err) {
        logE(mod, fun, `ERR while verifying portal JWT: ${beautify(err)}`)
        throw new ForbiddenError('Could not verify portal JWT', mod, fun)
      }
      const exp = tokenStringToJwtObject(jwt)?.payload[JWT_EXP]
      logD(mod, fun, `We got a new token, that expires on ${dateEpochSToIso(exp)}`)

      return { jwt, exp }
    } else {
      const errMsg = `${beautify(portalAnswer)}`
      logW(mod, fun, errMsg)
      throw RudiError.createRudiHttpError(portalAnswer.status, errMsg, mod, fun)
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

export const getTokenCheckedByPortal = async (jwt) => {
  const fun = 'getTokenCheckedByPortal'
  logT(mod, fun)
  if (isPortalConnectionDisabled()) return NO_PORTAL_MSG
  if (!jwt) throw new BadRequestError('No token to check!', mod, fun)
  let portalResponse
  try {
    portalResponse = await directPost(getUrlPortalAuthCheck(), `token=${jwt}`, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  } catch (err) {
    logE(mod, fun, `ERR GET Portal Jwt checked: ${beautify(err)}`)

    await createErrorReport(err, {
      step: 'submitting the token to Portal checks',
      description: 'An error occurred while having the token checked by the Portal',
      method: 'POST',
      url: getUrlPortalAuthCheck(),
    })
    throw RudiError.treatError(mod, fun, err)
  }
  if (portalResponse?.status === 200 && portalResponse?.data?.active) {
    logV(mod, fun, `RUDI Portal validated the token`)
    // logV(mod, fun, `RUDI Portal validated the token: ${beautify(portalResponse.data)}`)
    return portalResponse.data
  } else
    throw new ForbiddenError(
      `Portal invalidated the token: ${beautify(portalResponse?.data)}`,
      mod,
      fun
    )
}

/**
 * Verifies the JWT signature with the portal public key declared in the headers of the JWT
 * @param {*} jwt
 * @returns
 */
export const verifyPortalTokenSign = async (jwt) => {
  const fun = 'verifyPortalTokenSign'
  logT(mod, fun)
  let keyId
  try {
    if (isPortalConnectionDisabled()) return NO_PORTAL_MSG
    if (!jwt) throw new ForbiddenError('No token to verify!', mod, fun)

    const { header } = tokenStringToJwtObject(jwt)
    keyId = header?.kid
    if (!keyId) {
      logW(
        mod,
        fun,
        `Cannot verify JWT sign! Unexpected portal JWT headers: ${beautify(header)} in jwt ${jwt}`
      )
      return false
    }
    logT(mod, fun, `JWT signed with key ID: ${keyId}`)

    const portalPubKey = await getPortalJwtPubKey(keyId)
    if (portalPubKey) logV(mod, fun, `portalPubKey: ${!!portalPubKey}`)
    else {
      logW(
        mod,
        fun,
        `Cannot verify JWT sign! No portal JWT sign pub key found for ID ${keyId} in jwt ${jwt}`
      )
      return false
    }
    const { payload } = verifyToken(portalPubKey, jwt)

    if (!payload[JWT_USER] && payload[REQ_MTD])
      throw new ForbiddenError(
        `Using a RUDI internal JWT to access a Portal route is incorrect.`,
        mod,
        fun
      )

    return [header, payload]
  } catch (err) {
    const errMsg = `Invalid token: ${err}`
    logV(mod, fun, errMsg)
    const portalPubKeys = await getPortalPubKeys()
    if (keyId) {
      logI(mod, fun, `key ID: ${keyId}`)
      const msg = `cached key: ${keyId ? beautify(_cachedPortalJwtPubs[keyId]?.key) : beautify(_cachedPortalJwtPubs)}`
      logI(mod, fun, msg)
      const cachedPub = _cachedPortalJwtPubs[keyId]?.key?.n
      const portalPub = portalPubKeys.find((key) => key.kid == keyId)?.n
      if (cachedPub != portalPub)
        logW(mod, fun, `Portal pub \n'${portalPub}'\n ≠ Cached pub \n'${cachedPub}'`)
    } else {
      logD(mod, fun, `cached keys: ${beautify(_cachedPortalJwtPubs)}`)
      logD(mod, fun, `portal keys: ${beautify(portalPubKeys)}`)
    }
    throw RudiError.treatError(mod, fun, err)
  }
}

// -------------------------------------------------------------------------------------------------
// Portal calls: metadata
// -------------------------------------------------------------------------------------------------
const metadatasWaitingForPortalFeedback = []

export const removeMetadataFromWaitingList = (metadataId, reportId) => {
  const fun = 'removeMetadataFromWaitingList'
  try {
    const waitIndex = metadatasWaitingForPortalFeedback.findIndex(
      (sentMetadata) => sentMetadata[API_METADATA_ID] === metadataId
    )
    if (waitIndex === -1) {
      const warnMsg = `Metadata ${metadataId} (report ${reportId}) not found in the from waiting room`
      logW(mod, fun, warnMsg)
      return
    }
    if (metadatasWaitingForPortalFeedback[waitIndex][API_REPORT_ID] !== reportId) {
      const warnMsg = `Removing metadata ${metadataId} from the waiting room with mismatching reportId ${reportId}`
      logW(mod, fun, warnMsg)
    } else {
      const msg = `Removing metadata ${metadataId} from the waiting room with reportId ${reportId}`
      logD(mod, fun, msg)
    }
    metadatasWaitingForPortalFeedback.splice(waitIndex, 1)
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

const WAITING_ROOM_TIMEOUT_S = 3600
const WAIT_DATE = 'wait_date'

/**
 * Check a metadata
 * @param {String} metadataId UUID v4 (global_id) that identifies a metadata in this system
 * @return {Promise<Object>} The metadata
 */
const isMetadataSendableToPortal = async (metadataId) => {
  const fun = 'isMetadataAcceptableByPortal'
  try {
    if (isPortalConnectionDisabled()) return NO_PORTAL_MSG

    //--- Check input param
    if (!metadataId) throw new BadRequestError('Input metadata id is requested', mod, fun)
    if (!isUUID(metadataId)) throw new BadRequestError(`Badly formatted UUID: ${metadataId}`)

    //--- Get local metadata from ID
    const dbMetadata = await getObjectWithRudiId(OBJ_METADATA, metadataId)
    if (!dbMetadata) {
      const errMsg = `No data found locally for id '${metadataId}'`
      logW(mod, fun, errMsg)
      throw new NotFoundError(errMsg)
    }

    //--- If 'collection_tag' is set (ie for tests), metadata is not sent to the Portal
    const collectionTag = dbMetadata[API_COLLECTION_TAG]
    if (collectionTag) {
      logD(mod, fun, `Not sending to portal: ${metadataId} (${collectionTag})`)
      return false
    }

    //--- If media still need to be uploaded, metadata is not sent to the Portal
    if (
      dbMetadata[API_STORAGE_STATUS] === StorageStatus.Pending ||
      !isEveryMediaAvailable(dbMetadata)
    ) {
      logD(mod, fun, `Waiting for other media to get uploaded: ${metadataId}`)
      return false
    }
    //--- Checking the waiting room for
    //      - metadatas waiting for an integration report for too long to get purged from the list
    //      - the same metadata if it has already been sent to portal
    let isMetadataAlreadyWaitingToBeSent = false
    try {
      for (let i = metadatasWaitingForPortalFeedback.length - 1; i >= 0; i--) {
        const waitingMeta = metadatasWaitingForPortalFeedback[i]
        if (waitingMeta?.[WAIT_DATE] < timeEpochS() + WAITING_ROOM_TIMEOUT_S) {
          metadatasWaitingForPortalFeedback.splice(i, 1)
        } else if (
          !isMetadataAlreadyWaitingToBeSent &&
          waitingMeta[API_METADATA_ID] === dbMetadata[API_METADATA_ID] &&
          waitingMeta[DB_UPDATED_AT] >= dbMetadata[DB_UPDATED_AT]
        ) {
          isMetadataAlreadyWaitingToBeSent = true
        }
      }
    } catch (e) {
      logE(mod, `${fun}.purgeWaitBuffer`, e)
    }
    if (isMetadataAlreadyWaitingToBeSent) {
      logD(mod, fun, `Metadata is already waiting to be sent: ${metadataId}`)
      return false
    }

    //--- Puting the metadata in the waiting list
    const waitingMetadata = {
      [API_METADATA_ID]: dbMetadata[API_METADATA_ID],
      [DB_UPDATED_AT]: dbMetadata[DB_UPDATED_AT],
      [WAIT_DATE]: timeEpochS(),
    }
    const waitIndex = metadatasWaitingForPortalFeedback.push(waitingMetadata) - 1

    //--- If a media is restricted, metadata is not sent to the Portal
    // if( metadata[API_RESTRICTED_ACCESS]&&metadata[API_MEDIA_PROPERTY][0][API_MEDIA_CONNECTOR]

    //--- Ensuring we respect the format the Portal accepts
    let portalReadyMetadata
    try {
      portalReadyMetadata = dbMetadata.toRudiPortalJSON()
    } catch (e) {
      logE(mod, `${fun}.portalReadyMetadata`, e)
      dbMetadata[API_STATUS_PROPERTY] = MetadataStatus.Refused
      await dbMetadata.save()
      throw e
    }

    //--- Updating the DB metadata status
    setMetadataStatusToSent(dbMetadata)
    await dbMetadata.save()

    logV(mod, `${fun}.metadata_status saved`, dbMetadata[API_STATUS_PROPERTY])
    portalReadyMetadata[API_METAINFO_PROPERTY][API_METAINFO_DATES][API_DATES_PUBLISHED] = nowISO()
    return { portalReadyMetadata, waitIndex }
  } catch (err) {
    logW(mod, fun, err)
    throw RudiError.treatError(mod, fun, err)
  }
}

const PORTAL_POST_URL = postPortalMetaUrl()
export const sendMetadataToPortal = async (metadataId) => {
  const fun = 'sendMetadataToPortal'
  const report = { step: 'initializing', metadata: { [API_METADATA_ID]: metadataId } }

  try {
    logT(mod, fun)
    if (isPortalConnectionDisabled()) return NO_PORTAL_MSG

    // Checking if the metadata is ok to be sent
    // If so, a portal ready metadata JSON is retrieved
    const sendableData = await isMetadataSendableToPortal(metadataId)

    // TODO: if media is not portal compatible => error

    if (!sendableData) return
    const { portalReadyMetadata, waitIndex } = sendableData

    const waitingMetadata = metadatasWaitingForPortalFeedback[waitIndex]

    //--- Just a test
    // await getMetadataWithRudiId(metadataId)
    // logI(mod, `${fun}.dbMetadata`, dbMetadata)

    //--- Sending to portal
    logV(mod, fun, `Initiating the metadata sending to portal: ${beautify(portalReadyMetadata)}`)

    report.metadata = pick(portalReadyMetadata, [API_METADATA_ID, API_DATA_NAME_PROPERTY])
    report.step = 'retrieving Portal token'

    const portalToken = await getPortalToken()

    let portalAnswer
    try {
      report.step = 'checking if the metadata is on the portal'
      report.requestDetails = { method: 'GET', url: getPortalMetaUrl(metadataId) }
      logD(mod, fun, report.step)

      portalAnswer = await httpGet(
        getPortalMetaUrl(metadataId),
        portalToken,
        defaultPortalRequestOptions()
      )
    } catch (err) {
      // Only treat 404 as "metadata not found on portal" → POST
      // Any other error (timeout, network, 5xx…) should be re-thrown
      if (err?.statusCode !== 404 && err?.response?.status !== 404) {
        throw err
      }

      report.step = `sending a metadata that is not on the portal: '${metadataId}'`
      report.requestDetails = { method: 'POST', url: PORTAL_POST_URL }
      logD(mod, fun, report.step)

      const postAnswer = await httpPost(
        PORTAL_POST_URL,
        portalReadyMetadata,
        portalToken,
        defaultPortalRequestOptions()
      )
      waitingMetadata[API_REPORT_ID] = isUUID(postAnswer) ? postAnswer : postAnswer.data
      return postAnswer
    }
    const portalMetadata = portalAnswer

    if (getUpdatedDate(portalMetadata) < getUpdatedDate(portalReadyMetadata)) {
      report.step = `updating a metadata that is on the portal and older: '${metadataId}'`
      report.requestDetails = { method: 'PUT', url: PORTAL_POST_URL }
      logD(mod, fun, report.step)

      const putAnswer = await httpPut(
        PORTAL_POST_URL,
        portalReadyMetadata,
        portalToken,
        defaultPortalRequestOptions()
      )
      waitingMetadata[API_REPORT_ID] = isUUID(putAnswer) ? putAnswer : putAnswer.data
      return putAnswer
    } else {
      metadatasWaitingForPortalFeedback.splice(waitIndex, 1)
      logD(mod, fun, `Metadata is on the portal and same: not updating '${metadataId}'`)
    }
  } catch (err) {
    logW(mod, fun, beautify(err))
    report.description = 'An error occurred while sending the metadata to the Portal'
    report.objectType = ObjectTypes.DATASET
    await createErrorReport(err, report, 'update metadata status')
    throw RudiError.treatError(mod, fun, err)
  }
}

export const getPortalMetadataListWithToken = (token, additionalParameters) =>
  httpGet(getPortalMetaUrl(null, additionalParameters), token, defaultPortalRequestOptions())

export const getMetadataFromPortal = async (metadataId, additionalParameters) => {
  const fun = 'getMetadataFromPortal'
  logT(mod, fun)
  if (isPortalConnectionDisabled()) return NO_PORTAL_MSG
  const report = {}
  try {
    report.step = 'retrieving Portal token'
    const token = await getPortalToken()

    report.step = 'getting the metadata'
    report.method = 'GET'
    report.url = getPortalMetaUrl(metadataId, additionalParameters)
    report.metadata = { [API_METADATA_ID]: metadataId }
    report.description = 'An error occurred while getting a metadata from the Portal'

    if (!metadataId) {
      return httpGet(
        getPortalMetaUrl(null, additionalParameters),
        token,
        defaultPortalRequestOptions()
      )
    } else {
      return httpGet(
        getPortalMetaUrl(metadataId, additionalParameters),
        token,
        defaultPortalRequestOptions()
      )
    }
  } catch (err) {
    await createErrorReport(err, report)
    throw RudiError.treatError(mod, fun, err)
  }
}

export const deletePortalMetadata = async (metadataId) => {
  const fun = 'deletePortalMetadata'
  logT(mod, fun)
  try {
    if (isPortalConnectionDisabled()) return NO_PORTAL_MSG
    if (!metadataId) throw new BadRequestError('Metadata id required') // Can't get the resources list yet.

    const token = await getPortalToken()

    return await httpDelete(postPortalMetaUrl(metadataId), token, defaultPortalRequestOptions())
  } catch (err) {
    const error = new Error(`Couldn't delete on Portal side: ${err}`)
    throw RudiError.treatError(mod, fun, error)
  }
}

// -------------------------------------------------------------------------------------------------
// REST access
// -------------------------------------------------------------------------------------------------
export const checkPortalTokenInHeader = async (req, isCheckOptional) => {
  const fun = 'checkPortalTokenInHeader'
  logT(mod, fun)
  try {
    if (isPortalConnectionDisabled()) return NO_PORTAL_MSG
    const token = extractJwt(req)
    await verifyPortalTokenSign(token)
    await getTokenCheckedByPortal(token)
    return token
    // return jwtInfo
  } catch (err) {
    if (isCheckOptional) throw err
    const error = new UnauthorizedError(err)
    throw RudiError.treatError(mod, fun, error)
  }
}

export const exposedGetPortalToken = async (req, reply) => {
  const fun = 'exposedGetPortalToken'
  logT(mod, fun, `< GET new portal token`)
  try {
    if (isPortalConnectionDisabled()) return NO_PORTAL_MSG
    // logD(mod, fun, getAuthUrl())
    const token = await getPortalToken()
    return { access_token: token }
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

export const exposedCheckPortalToken = async (req, reply) => {
  const fun = 'exposedCheckPortalToken'
  logT(mod, fun, `< GET new portal token checked`)
  try {
    if (isPortalConnectionDisabled()) return NO_PORTAL_MSG
    // logD(mod, fun, getAuthUrl())
    const token = await getPortalToken()
    const { active, exp } = await getTokenCheckedByPortal(token)
    return { active, exp }
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

function updateOrganization(organization, portalOrganization, isAttached) {
  organization.organization_status = portalOrganization.organization_status
  organization.linked_producer_status =
    portalOrganization.linked_producer_status ?? organization.linked_producer_status

  if (
    Date.parse(organization.updatedAt) <
    Date.parse(portalOrganization?.organization_dates?.modified)
  ) {
    organization.organization_name = portalOrganization.organization_name

    organization.updatedAt = portalOrganization.organization_dates.modified

    if (portalOrganization.organization_summary) {
      organization.organization_summary = portalOrganization.organization_summary
    }
    if (portalOrganization.organization_address) {
      organization.organization_address = portalOrganization.organization_address
    }
  }

  return organization
}
