'use strict'

const mod = 'chk'

import _ from 'lodash'
const { pick } = _

import {
  COUNT_LABEL,
  LIST_LABEL,
  OBJ_METADATA,
  QUERY_FIELDS,
  TIME_LABEL,
} from '../config/constApi.js'
import {
  API_DATA_NAME_PROPERTY,
  API_DATA_PRODUCER_PROPERTY,
  API_MEDIA_ID,
  API_MEDIA_PROPERTY,
  API_METADATA_ID,
  API_METADATA_LOCAL_ID,
  API_ORGANIZATION_ID,
  API_ORGANIZATION_NAME,
  DB_UPDATED_AT,
} from '../db/dbFields.js'
import { getDbObjectListAndCount } from '../db/dbQueries.js'
import { RudiError } from '../utils/errors.js'
import { beautify, timeEpochS } from '../utils/jsUtils.js'
import { logD } from '../utils/logging.js'
import { parseQueryParameters } from '../utils/parseRequest.js'
// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { NO_PORTAL_MSG, isPortalConnectionDisabled } from '../config/confPortal.js'
import { getPortalMetadataListWithToken, getPortalToken } from './portalController.js'
// import { getMetadataListAndCount } from './genericController'

// -------------------------------------------------------------------------------------------------
// Cached variables
// -------------------------------------------------------------------------------------------------

const SLICE = 10
const DEFAULT_CACHE_PERIOD_S = 300

const cachedPortalMetadataList = {}
export const getPortalCachedMetadataList = async (req, reply) => {
  const fun = 'getPortalCachedMetadataList'
  try {
    if (isPortalConnectionDisabled()) return NO_PORTAL_MSG
    const query = req?.query
    const queryLimit = query?.max || query?.limit
    logD(mod, fun, `queryLimit: ${queryLimit}`)

    const cacheKey = `${beautify(query)}` || 'all'
    logD(mod, fun, `cacheKey: ${cacheKey}`)
    // Check cache date
    if (
      cachedPortalMetadataList[cacheKey] &&
      (cachedPortalMetadataList[cacheKey][TIME_LABEL] || 0) + DEFAULT_CACHE_PERIOD_S > timeEpochS()
    )
      // Cache still valid, let's return it
      return cachedPortalMetadataList[cacheKey]

    // Cache is too old, we have to retrieve the data from the portal
    // 1. Get a portal token
    const token = await getPortalToken()

    // 2. Retrieve the number of metadata on the portal
    const portalCheck = await getPortalMetadataListWithToken(token, 'limit=1')
    const portalMetadataNb = portalCheck.total ?? 0
    const maxMetaRequested = Math.min(queryLimit, portalMetadataNb)
    logD(mod, fun, `maxMetaRequested: ${maxMetaRequested}`)

    // 3. Retrieve all the metadata on the portal
    // const optsArray = []
    // for (let offset = 0; offset < portalMetadataNb; offset += SLICE)
    //   optsArray.push(`limit=${SLICE}&offset=${offset}`)
    // const metadataPackets = await Promise.all(
    //   optsArray.map((opt) => getPortalMetadataListWithToken(token, opt))
    // )

    const metadataPackets = []
    if (maxMetaRequested <= SLICE) {
      metadataPackets.push(await getPortalMetadataListWithToken(token, `limit=${queryLimit}`))
    } else {
      let leftRequested = maxMetaRequested
      for (let offset = 0; offset < maxMetaRequested; offset += SLICE) {
        metadataPackets.push(
          await getPortalMetadataListWithToken(
            token,
            `limit=${Math.min(SLICE, leftRequested)}&offset=${offset}`
          )
        )
        leftRequested -= SLICE
      }
    }

    const portalMetadataList = []
    metadataPackets.forEach((packet) => portalMetadataList.push(...packet.items))
    // 4. Recreate the cache of portal metadata
    cachedPortalMetadataList[cacheKey] = {
      [TIME_LABEL]: timeEpochS(),
      [COUNT_LABEL]: maxMetaRequested,
      [LIST_LABEL]: portalMetadataList,
    }
    // logD(mod, fun, cachedPortalMetadataList.items.length)
    return cachedPortalMetadataList[cacheKey]
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

let cachedNodeMetadataList = {}
export const getNodeCachedMetadataList = async (maxCacheTimeS = DEFAULT_CACHE_PERIOD_S) => {
  const fun = 'getNodeCachedMetadataList'
  try {
    // Check cache date
    if ((cachedNodeMetadataList[TIME_LABEL] || 0) + maxCacheTimeS > timeEpochS())
      // Cache still valid, let's return it
      return cachedNodeMetadataList

    // Cache is too old, we have to retrieve the data
    cachedNodeMetadataList = await getDbObjectListAndCount(OBJ_METADATA)
    cachedNodeMetadataList[TIME_LABEL] = timeEpochS()

    return cachedNodeMetadataList
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

const DEFAULT_FIELD_SELECTION = [
  API_METADATA_ID,
  API_METADATA_LOCAL_ID,
  `${API_DATA_PRODUCER_PROPERTY}.${API_ORGANIZATION_ID}`,
  `${API_DATA_PRODUCER_PROPERTY}.${API_ORGANIZATION_NAME}`,
  API_DATA_NAME_PROPERTY,
  `${API_MEDIA_PROPERTY}.${API_MEDIA_ID}`,
  DB_UPDATED_AT,
]
export const getPortalMetadataFields = async (req, reply, fields = DEFAULT_FIELD_SELECTION) => {
  const fun = 'getPortalMetadataFields'
  try {
    if (isPortalConnectionDisabled()) return NO_PORTAL_MSG
    const options = await parseQueryParameters(OBJ_METADATA, req.url)
    logD(mod, fun, `options: ${beautify(options)}`)
    const fieldFilter = options[QUERY_FIELDS] ?? fields
    if (fieldFilter.indexOf(API_METADATA_ID) === -1) fieldFilter.unshift(API_METADATA_ID)
    const nodeMetadata = (await getPortalCachedMetadataList(req, reply))[LIST_LABEL]
    return nodeMetadata.map((metadata) => pick(metadata, fieldFilter))
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

/**
 * Retrieves the metadata on the portal + the metadata on the node, and check
 * whether they are present on both sides
 */
export const checkCoherenceBetweenNodeAndPortal = () => {}

/**
 * Returns the list of portal metadata with their local_id and global_id
 */
