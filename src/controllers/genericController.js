const mod = 'genCtrl'
/*
 * In this file are made the different steps followed for each
 * action on the objects (producer or publisher)
 */

// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import { v4 as UUIDv4 } from 'uuid'

import _ from 'lodash'
const { pick } = _

// -------------------------------------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------------------------------------
import {
  ACT_DELETION,
  ACT_EXT_SEARCH,
  ACT_SEARCH,
  ACT_UNLINKED,
  MONGO_ERROR,
  OBJ_CONTACTS,
  OBJ_MEDIA,
  OBJ_METADATA,
  OBJ_ORGANIZATIONS,
  OBJ_PUB_KEYS,
  OBJ_PUB_KEYS_CAML,
  OBJ_SKOS_CONCEPTS,
  OBJ_SKOS_CONCEPTS_CAML,
  OBJ_SKOS_SCHEMES,
  OBJ_SKOS_SCHEMES_CAML,
  PARAM_ID,
  PARAM_OBJECT,
  PARAM_PROP,
  QUERY_CONFIRM,
  QUERY_COUNT_BY,
  QUERY_FIELDS,
  QUERY_FILTER,
  QUERY_GROUP_BY,
  QUERY_GROUP_LIMIT,
  QUERY_GROUP_LIMIT_CAML,
  QUERY_GROUP_OFFSET,
  QUERY_GROUP_OFFSET_CAML,
  QUERY_LANG,
  QUERY_LIMIT,
  QUERY_OBJECT_FORMAT,
  QUERY_OBJECT_STANDARD,
  QUERY_OFFSET,
  QUERY_SEARCH_TERMS,
  QUERY_SORT_BY,
  QUERY_SORT_BY_CAML,
  ROUTE_OPT,
  STATUS_CODE,
  URL_OBJECTS,
  URL_PUB_METADATA,
  URL_PV_OBJECT_GENERIC,
} from '../config/constApi.js'

import {
  DEFAULT_OBJECT_FORMAT,
  DEFAULT_OBJECT_STANDARD,
} from '../config/confTranslation/GMD_XML/confGMDXML.js'
import {
  countDbObjectList,
  countDbObjects,
  deleteAllDbObjectsWithType,
  deleteDbObject,
  deleteManyDbObjectsWithFilter,
  deleteManyDbObjectsWithRudiIds,
  doesObjectExistWithJson,
  doesObjectExistWithRudiId,
  getDbMetadataListAndCount,
  getDbObjectList,
  getEnsuredObjectWithRudiId,
  getObjectIdField,
  getRudiObjectList,
  groupDbObjectList,
  isReferencedInMetadata,
  overwriteDbObject,
  searchDbObjects,
} from '../db/dbQueries.js'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { logD, logE, logI, logT, logV, logW } from '../utils/logging.js'
import {
  objectAdded,
  objectAlreadyExists,
  objectNotDeletedBecauseUsed,
  objectTypeNotFound,
} from '../utils/msg.js'

import { accessProperty, accessReqParam } from '../utils/jsonAccess.js'

import { beautify, isEmptyArray, isEmptyObject } from '../utils/jsUtils.js'

import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  NotImplementedError,
  RudiError,
} from '../utils/errors.js'

import { CallContext } from '../definitions/constructors/callContext.js'
import { parseQueryParameters } from '../utils/parseRequest.js'

import { getTranslator } from '../translation/genericTranslationTools.js'

// -------------------------------------------------------------------------------------------------
// Specific controllers
// -------------------------------------------------------------------------------------------------
import { newMetadata, overwriteMetadata } from './metadataController.js'
import { newPublicKey, overwritePubKey } from './publicKeyController.js'
import { newSkosConcept, newSkosScheme, widenSearch } from './skosController.js'

import {
  API_ACCESS_CONDITION,
  API_COLLECTION_TAG,
  API_CONFIDENTIALITY,
  API_METADATA_ID,
  API_RESTRICTED_ACCESS,
} from '../db/dbFields.js'
import Contact from '../definitions/models/Contact.js'
import { Media } from '../definitions/models/Media.js'
import Organization from '../definitions/models/Organization.js'
import { deletePortalMetadata } from './portalController.js'

// -------------------------------------------------------------------------------------------------
// Specific object type helper functions
// -------------------------------------------------------------------------------------------------

function getObjectParam(req) {
  const fun = 'getObjectParam'
  try {
    const objectType = accessReqParam(req, PARAM_OBJECT)
    try {
      checkIsUrlObject(objectType)
    } catch {
      const error = new NotFoundError(`Route '${req.method} ${req.url}' not found `)
      throw RudiError.treatError(mod, fun, error)
    }
    return objectType
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

function checkIsUrlObject(objectType) {
  // const fun = 'checkIsUrlObject'
  // logT(mod, fun, beautify(URL_OBJECTS))
  if (URL_OBJECTS.indexOf(objectType) === -1)
    throw new NotFoundError(objectTypeNotFound(objectType))
}

async function newObject(objectType, objectData) {
  const fun = 'newObject'
  logT(mod, fun)
  try {
    // checkIsUrlObject(objectType)
    switch (objectType) {
      case OBJ_ORGANIZATIONS:
        return await newRudiObject(Organization, objectData)
      case OBJ_CONTACTS:
        return await newRudiObject(Contact, objectData)
      case OBJ_MEDIA:
        return await newRudiObject(Media, objectData)
      case OBJ_METADATA:
        return await newMetadata(objectData)
      case OBJ_SKOS_CONCEPTS:
      case OBJ_SKOS_CONCEPTS_CAML:
        return await newSkosConcept(objectData)
      case OBJ_SKOS_SCHEMES:
      case OBJ_SKOS_SCHEMES_CAML:
        // Custom creation to create the children scheme concepts
        return await newSkosScheme(objectData)
      case OBJ_PUB_KEYS:
      case OBJ_PUB_KEYS_CAML:
        return await newPublicKey(objectData)

      default:
        throw new NotFoundError(objectTypeNotFound(objectType))
    }
  } catch (err) {
    if (err[STATUS_CODE] === 400) {
      throw new BadRequestError(err.message, mod, `${fun}.${objectType}`, err.path)
    }
    throw RudiError.treatError(mod, fun, err)
  }
}
async function newRudiObject(Model, objectData) {
  const fun = 'newRudiObject'
  try {
    const dbObject = new Model(objectData)
    await dbObject.save()
    return dbObject
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

async function isObjectReferenced(objectType, rudiId) {
  const fun = 'isObjectReferenced'
  try {
    switch (objectType) {
      case OBJ_ORGANIZATIONS:
      case OBJ_CONTACTS:
      case OBJ_MEDIA: {
        logD(mod, fun, `objectType: ${objectType}, id: ${rudiId}`)
        return await isReferencedInMetadata(objectType, rudiId)
      }
      default:
        return false
    }
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

function overrideFilter(filterList, field, value) {
  const fun = 'overrideFilter'
  const newFilter = { [field]: value }

  if (!filterList || Object.keys(filterList).length === 0 || filterList[field])
    return { $and: [newFilter] }
  if (!filterList?.$and) {
    // Simple filter
    return { $and: [filterList, newFilter] }
  }

  filterList.$and.findIndex((val, i, ara) => {
    if (Object.keys(val).indexOf(field) !== -1) ara.splice(i, 1)
  })
  logD(mod, fun, beautify(filterList))
  filterList.$and.push(newFilter)
  logD(mod, fun, beautify(filterList))
  return filterList
}

/**
 * Add a new rudi object
 *
 */
async function addSingleRudiObject(rudiObject, objectType, context) {
  const fun = 'addSingleRudiObject'
  logT(mod, fun)
  try {
    // get the rudiId field for this object type
    const idField = getObjectIdField(objectType)

    // retrieving the id
    // logD(mod, fun, `objectType: '${objectType}', incomingData: '${beautify(rudiObject)}' `)
    const rudiId = accessProperty(rudiObject, idField)

    // First: we make sure object doesn't exist already
    const existsObject = await doesObjectExistWithJson(objectType, rudiObject)
    if (existsObject) throw new ForbiddenError(`${objectAlreadyExists(objectType, rudiId)}`)

    // Creating new object + specific treatments
    const createdObject = await newObject(objectType, rudiObject)
    // logV(mod, fun, beautify(createdObject, 2))
    logI(mod, fun, `${objectAdded(objectType, rudiId)}`)

    if (context) context.addObjId(objectType, rudiId)
    return createdObject
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

/**
 * Check if object need translation. If so, translates and add the object, else add the object.
 * @param {*} inputObject the source object
 * @param {String} objectType the rudi type (ex: resources, contacts, ...)
 * @param {String} idField the field of the id in the rudi metadata
 * @param {String} objectStandard the standard of the source object (ex: dcat, gmd). default : rudi
 * @param {String} objectFormat the format of the source object (ex: xml, json)
 * @param {*} context
 * @returns
 */
async function addSingleObject(inputObject, objectType, objectStandard, objectFormat, context) {
  const fun = 'addSingleObject'
  try {
    let rudiObject
    if (objectFormat === DEFAULT_OBJECT_FORMAT && objectStandard === DEFAULT_OBJECT_STANDARD) {
      rudiObject = inputObject
    } else {
      const objectTranslator = getTranslator(objectType, objectStandard, objectFormat)
      if (!objectTranslator) {
        throw new NotImplementedError(
          `Object of type ${objectType}, at standard ${objectStandard} and format ${objectFormat} can not yet be uploaded.`
        )
      }
      rudiObject = await objectTranslator.translateInputObject(inputObject, true)
    }
    return await addSingleRudiObject(rudiObject, objectType, context)
  } catch (e) {
    throw RudiError.treatError(mod, fun, e)
  }
}

// -------------------------------------------------------------------------------------------------
// Controllers
// -------------------------------------------------------------------------------------------------

/**
 * Add one or many object
 * => POST /{object}
 */
export const addObjects = async (req, reply) => {
  const fun = 'addObjects'
  try {
    logT(mod, fun, `< POST ${URL_PV_OBJECT_GENERIC}`)

    // get the objectStandard query param, default=rudi
    const objectStandard = req.query?.[QUERY_OBJECT_STANDARD] ?? DEFAULT_OBJECT_STANDARD

    // get the objectFormat query param, default=json
    const objectFormat = req.query?.[QUERY_OBJECT_FORMAT] ?? DEFAULT_OBJECT_FORMAT

    const objectType = getObjectParam(req)

    // accessing the request body
    const inputObjects = req.body

    const context = CallContext.getCallContextFromReq(req)

    let createdObjects
    if (Array.isArray(inputObjects)) {
      createdObjects = []
      for (const inputObject of inputObjects) {
        createdObjects.push(
          addSingleObject(inputObject, objectType, objectStandard, objectFormat, context)
        )
      }
      await Promise.all(createdObjects)
    } else {
      createdObjects = await addSingleObject(
        inputObjects,
        objectType,
        objectStandard,
        objectFormat,
        context
      )
    }
    return createdObjects
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

/**
 * Get single object by ID
 * => GET /{object}/{id}
 */
export const getSingleObject = async (req, reply) => {
  const fun = 'getSingleObject'
  try {
    logT(mod, fun, `< GET ${URL_PV_OBJECT_GENERIC}/:${PARAM_ID}`)
    // retrieve url parameters: object type, object id
    const objectType = getObjectParam(req)
    const objectId = accessReqParam(req, PARAM_ID)
    const objectProp = req.params[PARAM_PROP] // Could be null

    // ensure the object exists
    const dbObject = await getEnsuredObjectWithRudiId(objectType, objectId)
    // return the object

    const context = CallContext.getCallContextFromReq(req)
    if (context) context.addObjId(objectType, objectId)

    return objectProp ? dbObject[objectProp] : dbObject
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

/**
 * Get several objects
 * => GET /{object}
 */
export const getObjectList = async (req, reply) => {
  const fun = 'getObjectList'
  try {
    logT(mod, fun, `< GET ${URL_PV_OBJECT_GENERIC}`)
    // retrieve url parameter: object type
    // logD(mod, fun, beautify(req))
    const objectType = getObjectParam(req)

    return await getManyObjects(objectType, req)
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

/**
 * Search objects
 * => GET /{object}/search
 */
export const searchObjects = async (req, reply) => {
  const fun = 'searchObjects'
  try {
    logT(mod, fun, `< GET ${URL_PV_OBJECT_GENERIC}/${ACT_SEARCH}`)
    // retrieve url parameters: object type, object id
    const objectType = getObjectParam(req)
    logV(mod, fun + '.config', beautify(req.routeOptions?.config))
    logV(mod, fun + '.schema', req.routeOptions.schema)
    const opt = req.routeOptions?.config ? req.routeOptions?.config[ROUTE_OPT] : undefined
    logD(mod, fun + '.opt', opt)

    let parsedParameters
    try {
      parsedParameters = await parseQueryParameters(objectType, req.url)
    } catch (err) {
      logW(mod, fun, err)
      return []
    }

    // If there w
    if (isEmptyArray(parsedParameters)) {
      logW(mod, fun, 'No search parameters given')
      return []
    } else {
      logI(mod, fun, `Parsed parameters: ${beautify(parsedParameters)}`)
    }

    const options = pick(parsedParameters, [
      QUERY_LANG,
      QUERY_LIMIT,
      QUERY_OFFSET,
      QUERY_SORT_BY,
      QUERY_FILTER,
      QUERY_FIELDS,
      QUERY_SEARCH_TERMS,
      QUERY_COUNT_BY,
    ])

    if (opt === ACT_EXT_SEARCH) {
      try {
        const extendedSearchTerms = await widenSearch(
          options[QUERY_SEARCH_TERMS],
          options[QUERY_LANG]
        )
        logD(mod, fun, `extendedSearchTerms: ${extendedSearchTerms}`)
        options[QUERY_SEARCH_TERMS].push(extendedSearchTerms)
      } catch {
        // logE(mod, fun, `SKOSMOS down!: ERR ${e}`)
      }
    }
    const objectList = await searchDbObjects(objectType, options)

    // return the object

    // const context = CallContext.getCallContextFromReq(req)
    // if (context) context.addObjId(objectType, objectId)

    return objectList
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

export const getSearchableProperties = (req, reply) => {
  const fun = 'getSearchableProperties'
  try {
    logT(mod, fun)
    const rudiObjectList = getRudiObjectList()
    const getSearchableFields = {}
    // logD(mod, fun, `rudiObjectList: ${beautify(rudiObjectList)}`)
    Object.keys(rudiObjectList).forEach((objectType) => {
      try {
        getSearchableFields[objectType] = rudiObjectList[objectType].ObjModel.getSearchableFields()
      } catch {
        logD(mod, fun, `${objectType}: not searchable`)
      }
    })
    return getSearchableFields
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

/**
 * Get several objects for a particular object type
 */
export const getManyObjects = async (objectType, req) => {
  const fun = 'getManyObjects'
  try {
    logT(mod, fun)
    let parsedParameters
    try {
      parsedParameters = await parseQueryParameters(objectType, req.url)
    } catch (err) {
      logW(mod, fun, err)
      return []
    }
    logD(mod, fun, beautify(parsedParameters))

    const countBy = parsedParameters[QUERY_COUNT_BY]
    const groupBy = parsedParameters[QUERY_GROUP_BY]

    // accessing the objects
    let objectList
    if (!countBy && !groupBy) {
      const options = pick(parsedParameters, [
        QUERY_LIMIT,
        QUERY_OFFSET,
        QUERY_SORT_BY,
        QUERY_SORT_BY_CAML,
        QUERY_FILTER,
        QUERY_FIELDS,
      ])
      objectList = await getDbObjectList(objectType, options)
    } else if (groupBy) {
      if (countBy) {
        const msg = `'${QUERY_GROUP_BY}' parameter found, '${QUERY_COUNT_BY}' is redundant and ignored`
        logW(mod, fun, msg)
      }
      const options = pick(parsedParameters, [
        QUERY_LIMIT,
        QUERY_OFFSET,
        QUERY_FILTER,
        QUERY_FIELDS,
        QUERY_SORT_BY,
        QUERY_SORT_BY_CAML,
        QUERY_GROUP_LIMIT,
        QUERY_GROUP_LIMIT_CAML,
        QUERY_GROUP_OFFSET,
        QUERY_GROUP_OFFSET_CAML,
      ])
      objectList = await groupDbObjectList(objectType, groupBy, options)
    } else {
      // if( !!countBy)
      const options = pick(parsedParameters, [
        QUERY_LIMIT,
        QUERY_OFFSET,
        QUERY_FILTER,
        QUERY_FIELDS,
      ])

      objectList = await countDbObjectList(objectType, countBy, options)
    }
    // logD(mod, fun, `objectList: ${beautify(objectList)}`)

    return objectList
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

export const countObjects = async (req, reply) => {
  const fun = 'countObjects'
  try {
    logT(mod, fun)
    const objectType = getObjectParam(req)
    const count = await countDbObjects(objectType)
    return count
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

/**
 * Get many metadata and a count of all that match the filter
 * @param {*} req
 * @param {*} reply
 * @returns
 */
export const getMetadataListAndCount = async (req, reply) => {
  const fun = 'getMetadataListAndCount'
  try {
    logT(mod, fun, `< GET ${URL_PUB_METADATA}`)

    let parsedParameters
    try {
      parsedParameters = await parseQueryParameters(OBJ_METADATA, req.url)
    } catch (err) {
      logW(mod, fun, err)
      return []
    }
    let objectList
    const options = pick(parsedParameters, [
      QUERY_LIMIT,
      QUERY_OFFSET,
      QUERY_SORT_BY,
      QUERY_FILTER,
      QUERY_FIELDS,
    ])
    // logD(mod, fun, beautify(options[QUERY_FILTER]))
    options[QUERY_FILTER] = overrideFilter(
      options[QUERY_FILTER],
      `${API_ACCESS_CONDITION}.${API_CONFIDENTIALITY}.${API_RESTRICTED_ACCESS}`,
      false
    )
    logD(mod, fun, beautify(options[QUERY_FILTER]))

    objectList = await getDbMetadataListAndCount(options)
    logD(mod, fun, objectList.total)
    return objectList
  } catch (err) {
    const error = err.name === MONGO_ERROR ? new BadRequestError(err) : new NotFoundError(err)
    throw RudiError.treatError(mod, fun, error)
  }
}

export const getManyPubKeys = async (req, reply) => {
  const fun = 'getPubKeys'
  try {
    logT(mod, fun)
    return await getManyObjects(OBJ_PUB_KEYS, req)
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

/**
 * Update an existing object or creates it if it doesn't exist
 * => PUT /{object}
 */
export const upsertSingleRudiObject = async (rudiObject, objectType, context) => {
  const fun = 'upsertSingleRudiObject'
  logT(mod, fun)
  try {
    // retrieve url parameters: object type, object id
    const idField = getObjectIdField(objectType)

    // retrieve url parameters: object type, object id
    const rudiId = accessProperty(rudiObject, idField)

    const existsObject = await doesObjectExistWithRudiId(objectType, rudiId)

    if (context) context.addObjId(objectType, rudiId)

    if (!existsObject) return await newObject(objectType, rudiObject)

    switch (objectType) {
      case OBJ_METADATA:
        return await overwriteMetadata(rudiObject)
      case OBJ_PUB_KEYS:
        return await overwritePubKey(rudiObject)
      default:
        return await overwriteDbObject(objectType, rudiObject)
    }
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

/**
 * Translate and upsert an object
 * @param {*} inputObject the source object
 * @param {String} objectType the rudi type (ex: resources, contacts, ...)
 * @param {String} idField the field of the id in the rudi metadata
 * @param {String} objectStandard the standard of the source object (ex: dcat, gmd). default : rudi
 * @param {String} objectFormat the format of the source object (ex: xml, json)
 * @param {*} context
 * @returns
 */
async function upsertSingleObject(inputObject, objectType, objectStandard, objectFormat, context) {
  const fun = 'upsertSingleObject'
  logT(mod, fun, `< PUT ${URL_PV_OBJECT_GENERIC}`)
  logD(mod, fun, `objectType: ${objectType}`)
  logD(mod, fun, `objectStandard: ${objectStandard}`)
  logD(mod, fun, `objectFormat: ${objectFormat}`)
  logD(mod, fun, `inputObject: ${beautify(inputObject)}`)

  let rudiObject
  try {
    if (objectFormat === DEFAULT_OBJECT_FORMAT && objectStandard === DEFAULT_OBJECT_STANDARD) {
      rudiObject = inputObject
      logT(
        mod,
        fun,
        `Standard ${objectFormat.toUpperCase()} ${objectStandard.toUpperCase()} object`
      )
    } else {
      logT(mod, fun, `Translation needed for ${objectFormat} ${objectStandard} object`)
      const objectTranslator = getTranslator(objectType, objectStandard, objectFormat)
      if (!objectTranslator) {
        throw new NotImplementedError(
          `Object of type ${objectType}, at standard ${objectStandard} and format ${objectFormat} can not yet be uploaded.`
        )
      }
      rudiObject = await objectTranslator.translateInputObject(inputObject, true)
    }
    return await upsertSingleRudiObject(rudiObject, objectType, context)
  } catch (e) {
    throw RudiError.treatError(mod, fun, e)
  }
}

/**
 * Upsert a list of objects, or a single object. Route PUT /object/[objects] || /object/id
 * @param {*} req
 * @param {*} reply
 * @returns
 */
export const upsertObjects = async (req, reply) => {
  const fun = 'upsertObjects'
  try {
    logT(mod, fun, `< PUT ${URL_PV_OBJECT_GENERIC}`)

    // get the objectStandard query param, default=rudi
    const objectStandard = req.query?.[QUERY_OBJECT_STANDARD] ?? DEFAULT_OBJECT_STANDARD

    // get the objectFormat query param, default=json
    const objectFormat = req.query?.[QUERY_OBJECT_FORMAT] ?? DEFAULT_OBJECT_FORMAT

    const objectType = getObjectParam(req)

    // accessing the request body
    const inputObjects = req.body

    const context = CallContext.getCallContextFromReq(req)

    let createdObjects
    if (Array.isArray(inputObjects)) {
      createdObjects = []
      for (const inputObject of inputObjects) {
        createdObjects.push(
          upsertSingleObject(inputObject, objectType, objectStandard, objectFormat, context)
        )
      }
      await Promise.all(createdObjects)
    } else {
      createdObjects = await upsertSingleObject(
        inputObjects,
        objectType,
        objectStandard,
        objectFormat,
        context
      )
    }
    return createdObjects
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

/**
 * Delete a single object
 * => DELETE /{object}/{id}
 */
export const deleteSingleObject = async (req, reply) => {
  const fun = 'deleteSingleObject'
  try {
    logT(mod, fun, `< DELETE ${URL_PV_OBJECT_GENERIC}/:${PARAM_ID}`)
    // retrieve url parameters: object type, object id
    const objectType = getObjectParam(req)
    const rudiId = accessReqParam(req, PARAM_ID)

    // ensure the object exists
    const rudiObj = await getEnsuredObjectWithRudiId(objectType, rudiId)

    const metaReferencingObject = await isObjectReferenced(objectType, rudiId)
    if (metaReferencingObject)
      throw new ForbiddenError(
        objectNotDeletedBecauseUsed(objectType, metaReferencingObject[API_METADATA_ID])
      )

    // TODO: if SkosScheme: delete all SkosConcepts that reference it
    // TODO: if SkosConcept: update all other SkosConcepts that reference it (parents/children/siblings/relatives)
    const answer = await deleteDbObject(objectType, rudiId)

    if (objectType === OBJ_METADATA && !rudiObj[API_COLLECTION_TAG]) {
      deletePortalMetadata(rudiId)
        .then(() => logI(mod, fun, `Portal accepted the deletion request for metadata '${rudiId}'`))
        .catch((err) => logE(mod, fun, `Portal couldn't delete metadata '${rudiId}': ${err}`))
    }

    const context = CallContext.getCallContextFromReq(req)
    if (context) context.addObjId(objectType, rudiId)

    return answer
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

/**
 * Delete several objects
 * => POST /{object}/deletion
 */
export const deleteObjectList = async (req, reply) => {
  const fun = 'deleteObjectList'
  try {
    logT(mod, fun, `< POST ${URL_PV_OBJECT_GENERIC}/${ACT_DELETION}`)
    // retrieve url parameters: object type, object id
    const objectType = getObjectParam(req)

    // TODO: retrieve the metadata ids, DELETE on portal side with
    // deletePortalMetadata(id)

    // retrieve incoming data
    const filter = req.body
    logD(mod, fun, beautify(filter))
    let deletionResult
    if (Array.isArray(filter)) {
      deletionResult = await deleteManyDbObjectsWithRudiIds(objectType, filter)
    } else {
      deletionResult = await deleteManyDbObjectsWithFilter(objectType, filter)
    }
    return deletionResult
  } catch (err) {
    // logW(mod, fun, err)
    // logE(mod, fun, `method: ${beautify(req.method)}`)
    // logE(mod, fun, `url: ${beautify(req.url)}`)
    // logE(mod, fun, `params: ${beautify(req.params)}`)
    // logE(mod, fun, `body: ${beautify(req.body)}`)
    throw RudiError.treatError(mod, fun, err)
  }
}

/**
 * Delete every object
 * => DELETE /{object}
 */
export const deleteManyObjects = async (req, reply) => {
  const fun = 'deleteManyObjects'
  try {
    logT(mod, fun, `< DELETE ${URL_PV_OBJECT_GENERIC}`)
    const objectType = getObjectParam(req)
    let parsedParameters = await parseQueryParameters(objectType, req.url)
    logD(mod, fun, `parsedParameters: ${beautify(parsedParameters)}`)
    const filter = parsedParameters[QUERY_FILTER]
    // const fields = parsedParameters[QUERY_FIELDS]

    if (isEmptyObject(filter)) {
      if (parsedParameters[QUERY_CONFIRM]) return await deleteAllDbObjectsWithType(objectType)
      else {
        const msg = `Use confirm=true as a parameter to confirm the deletion of all ${objectType}`
        logW(mod, fun, msg)
        throw new BadRequestError(msg, mod, fun)
      }
    }
    // TODO: retrieve the metadata ids, DELETE on portal side with
    // deletePortalMetadata(id)

    return await deleteManyDbObjectsWithFilter(objectType, filter)
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

/**
 * Generate an UUID v4
 */
export const getOrphans = async (objectType) => {
  const fun = 'getOrphans'
  logT(mod, fun, `< GET ${URL_PV_OBJECT_GENERIC}/${ACT_UNLINKED}`)

  return await getOrphans(objectType)
}

/**
 * Generate an UUID v4
 */
export const generateUUID = async (req, reply) => {
  const fun = 'generateUUID'
  try {
    logT(mod, fun)
    return UUIDv4()
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}
