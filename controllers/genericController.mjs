const mod = 'genCtrl'
/*
 * In this file are made the different steps followed for each
 * action on the objects (producer or publisher)
 */

// ------------------------------------------------------------------------------------------------
// External dependencies
// ------------------------------------------------------------------------------------------------
import mongoose from 'mongoose'
import { v4 as UUIDv4 } from 'uuid'

import _ from 'lodash'
const { pick } = _

// ------------------------------------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------------------------------------
import {
  ACT_DELETION,
  ACT_SEARCH,
  ACT_UNLINKED,
  DEFAULT_QUERY_LIMIT,
  DEFAULT_QUERY_OFFSET,
  MONGO_ERROR,
  OBJ_CONTACTS,
  OBJ_MEDIA,
  OBJ_METADATA,
  OBJ_ORGANIZATIONS,
  OBJ_SKOS_CONCEPTS,
  OBJ_SKOS_SCHEMES,
  PARAM_ID,
  PARAM_OBJECT,
  QUERY_CONFIRM,
  QUERY_COUNT_BY_CAML,
  QUERY_COUNT_BY,
  QUERY_FIELDS,
  QUERY_FILTER,
  QUERY_GROUP_BY_CAML,
  QUERY_GROUP_BY,
  QUERY_GROUP_LIMIT_CAML,
  QUERY_GROUP_LIMIT,
  QUERY_GROUP_OFFSET_CAML,
  QUERY_GROUP_OFFSET,
  QUERY_LIMIT,
  QUERY_OFFSET,
  QUERY_SEARCH_TERMS,
  QUERY_SORT_BY_CAML,
  QUERY_SORT_BY,
  QUERY_UPDATED_AFTER_CAML,
  QUERY_UPDATED_AFTER,
  QUERY_UPDATED_BEFORE_CAML,
  QUERY_UPDATED_BEFORE,
  URL_OBJECTS,
  URL_PUB_METADATA,
  URL_PV_OBJECT_GENERIC,
  OBJ_SKOS_CONCEPTS_CAML,
  OBJ_SKOS_SCHEMES_CAML,
  OBJ_PUB_KEYS,
  OBJ_PUB_KEYS_CAML,
  PARAM_PROP,
  ACT_EXT_SEARCH,
  ROUTE_OPT,
} from '../config/confApi.mjs'

import {
  API_DATA_DATES_PROPERTY,
  API_DATES_CREATED,
  API_DATES_EDITED,
  API_DATES_VALIDATED,
  API_DATES_PUBLISHED,
  API_DATES_EXPIRES,
  API_DATES_DELETED,
  API_END_DATE_PROPERTY,
  API_KEYWORDS_PROPERTY,
  API_METAINFO_DATES,
  API_METAINFO_PROPERTY,
  API_PERIOD_PROPERTY,
  API_START_DATE_PROPERTY,
  DB_CREATED_AT,
  DB_ID,
  DB_PUBLISHED_AT,
  DB_UPDATED_AT,
} from '../db/dbFields.mjs'
import {
  countObjectList,
  deleteAll,
  deleteManyWithFilter,
  deleteManyWithRudiIds,
  deleteObject,
  doesObjectExistWithJson,
  doesObjectExistWithRudiId,
  getEnsuredObjectWithRudiId,
  getModelPropertyNames,
  getNestedObject,
  getObjectIdField,
  getObjectList as getDbObjectList,
  getObjectModel,
  getRudiObjectList,
  groupObjectList,
  isReferencedInMetadata,
  overwriteObject,
  searchObjects as searchDbObjects,
} from '../db/dbQueries.mjs'

const QUERY_RESERVED_WORDS = [
  QUERY_CONFIRM,
  QUERY_COUNT_BY,
  QUERY_FIELDS,
  QUERY_GROUP_BY,
  QUERY_GROUP_LIMIT,
  QUERY_GROUP_OFFSET,
  QUERY_LIMIT,
  QUERY_OFFSET,
  QUERY_SORT_BY,
  QUERY_UPDATED_AFTER_CAML,
  QUERY_UPDATED_AFTER,
  QUERY_UPDATED_BEFORE_CAML,
  QUERY_UPDATED_BEFORE,
]

const EXT_REFS = 'external_references' // External references needing aggregation
const EXT_OBJ = 'refObj'
const EXT_OBJ_PROP = 'refObjProp'
const EXT_OBJ_VAL = 'refObjVal'

// ------------------------------------------------------------------------------------------------
// Internal dependencies
// ------------------------------------------------------------------------------------------------
import { logD, logE, logI, logMetadata, logT, logW } from '../utils/logging.mjs'
import {
  objectAdded,
  objectAlreadyExists,
  objectNotDeletedBecauseUsed,
  objectTypeNotFound,
} from '../utils/msg.mjs'

import { accessProperty, accessReqParam } from '../utils/jsonAccess.mjs'

import {
  beautify,
  nowISO,
  isNotEmptyArray,
  isEmptyObject,
  isEmptyArray,
} from '../utils/jsUtils.mjs'

import {
  NotFoundError,
  ForbiddenError,
  ObjectNotFoundError,
  BadRequestError,
  ParameterExpectedError,
  RudiError,
} from '../utils/errors.mjs'

import { CallContext } from '../definitions/constructors/callContext.mjs'

// ------------------------------------------------------------------------------------------------
// Specific controllers
// ------------------------------------------------------------------------------------------------
import { newMetadata, overwriteMetadata } from './metadataController.mjs'
import { newOrganization } from './organizationController.mjs'
import { newContact } from './contactController.mjs'
import { newSkosConcept, newSkosScheme, widenSearch } from './skosController.mjs'
import { newPublicKey, overwritePubKey } from './publicKeyController.mjs'

import { deletePortalMetadata } from './portalController.mjs'

// ------------------------------------------------------------------------------------------------
// Specific object type helper functions
// ------------------------------------------------------------------------------------------------

function cleanDate(inputDate) {
  const fun = 'cleanDate'

  const cleanValue = inputDate.replace(/[\'\"\`]/g, '')
  if (cleanValue.match(new RegExp(/^[0-9]{10}$/))) return new Date(parseInt(cleanValue * 1000))
  if (cleanValue.match(new RegExp(/^[0-9]{13}$/))) return new Date(parseInt(cleanValue))
  try {
    const cleanDate = new Date(cleanValue)
    if (cleanDate === 'Invalid Date')
      throw new BadRequestError(`Invalid date: '${inputDate} / ${cleanValue}'`)
    // logD(mod, fun, `clean date: ${cleanDate.toISOString()}`)
    return cleanDate
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

function cleanDateOperations(inputDateOperations) {
  const fun = 'cleanDateOperation'
  logT(mod, fun, `inputDateOperations: ${beautify(inputDateOperations)}`)

  const operations = {}
  for (const [operator, value] of Object.entries(inputDateOperations)) {
    // if (isObject(value)) { // case with
    //   for (const [op, val] of Object.entries(value)) {
    //     if (op === '$and' || op === '$or') {
    //       operations[op] = val.map(expr => )
    //     } else {
    //       logW(mod, fun, `Operator '${op}' not recognized for dates comparisons`)
    //     }
    //   }
    // } else {
    operations[operator] = cleanDate(value)
    // }
  }
  return operations
}
const DATA_DATES = `${API_DATA_DATES_PROPERTY}.`
const META_DATES = `${API_METAINFO_PROPERTY}.${API_METAINFO_DATES}.`

// eslint-disable-next-line complexity
export const parseQueryParameters = async (objectType, fullUrl) => {
  const fun = 'parseQueryParameters'
  try {
    logT(mod, fun, ``)
    // identify object model
    const Model = getObjectModel(objectType)
    const modelProperties = getModelPropertyNames(Model)

    const returnedFilter = {
      [QUERY_LIMIT]: DEFAULT_QUERY_LIMIT,
      [QUERY_GROUP_LIMIT]: DEFAULT_QUERY_LIMIT,
      [QUERY_OFFSET]: DEFAULT_QUERY_OFFSET,
      [QUERY_GROUP_OFFSET]: DEFAULT_QUERY_OFFSET,
      [QUERY_FILTER]: {},
      [QUERY_CONFIRM]: false,
      [EXT_REFS]: [],
      [QUERY_SEARCH_TERMS]: [],
    }
    const filters = []

    // extract request parameters
    if (fullUrl.indexOf('?') === -1) {
      // logD(mod, fun, `No question mark in url: ${reqUrl}`)
      return returnedFilter
    }
    // const reqArgs = reqUrl.substring(reqUrl.indexOf('?'))
    const splitUrl = fullUrl.split('?')
    const reqUrl = splitUrl[0]
    const reqArgs = splitUrl[1]
    const urlSegments = reqUrl.split('/')
    const lastSegment = urlSegments[urlSegments.length - 1]
    const searching = lastSegment === ACT_SEARCH || lastSegment === ACT_EXT_SEARCH
    const urlParams = new URLSearchParams(reqArgs)

    // Check if parameters were actually found by URLSearchParams
    if (urlParams.keys().length < 1) {
      logD(mod, fun, `No parameters found after the question mark: ${urlParams}`)
      return returnedFilter
    }
    //  logD(mod, fun, `urlSearchParams: ${urlSearchParams}`)

    for (const [key, value] of urlParams) {
      if (QUERY_RESERVED_WORDS.includes(key)) {
        // logD(mod, fun, `Key is a reserved word: ${beautify(key)} => ${beautify(queryParameters[key])}`)
        switch (key) {
          case QUERY_LIMIT:
          case QUERY_OFFSET:
          case QUERY_GROUP_LIMIT:
          case QUERY_GROUP_LIMIT_CAML:
          case QUERY_GROUP_OFFSET:
          case QUERY_GROUP_OFFSET_CAML:
            returnedFilter[key] = parseInt(value)
            break
          case QUERY_GROUP_BY:
          case QUERY_GROUP_BY_CAML:
          case QUERY_COUNT_BY:
          case QUERY_COUNT_BY_CAML:
            returnedFilter[key] = value
            break
          case QUERY_UPDATED_AFTER:
          case QUERY_UPDATED_AFTER_CAML:
            filters.push({ [DB_UPDATED_AT]: mongoose.trusted({ $gte: cleanDate(value) }) })
            break
          case QUERY_UPDATED_BEFORE:
          case QUERY_UPDATED_BEFORE_CAML:
            filters.push({ [DB_UPDATED_AT]: mongoose.trusted({ $lte: cleanDate(value) }) })
            break
          case QUERY_CONFIRM:
            if (['false', '0', 'null', 'no'].includes(value)) break
            returnedFilter[key] = !!value
            break
          case QUERY_FIELDS:
            returnedFilter[key] = value.split(',').map((field) => field.trim())
            break
          case QUERY_SORT_BY:
          case QUERY_SORT_BY_CAML:
            returnedFilter[key] = value.split(',').map((field) => {
              let trimmedField = field.trim()
              let minus = ''
              let absoluteField = trimmedField
              if (trimmedField[0] === '-') {
                minus = '-'
                absoluteField = trimmedField.substring(1)
              }
              // Dealing with virtual fields
              switch (absoluteField) {
                case `${META_DATES}${API_DATES_CREATED}`:
                  return `${minus}${DB_CREATED_AT}`
                case `${META_DATES}${API_DATES_EDITED}`:
                  return `${minus}${DB_UPDATED_AT}`
                case `${META_DATES}${API_DATES_PUBLISHED}`:
                  return `${minus}${DB_PUBLISHED_AT}`
                default:
                  return trimmedField
              }
            })
            break
          default:
            logW(mod, fun, `Query keyword not recognized: '${key}'`)
        }
      } else if (modelProperties.includes(key)) {
        // logD(mod, fun, `Key is a ${objectType} property: ${beautify(key)}`)
        // logD(mod, fun, `Corresponding value: ${value}`)
        const val = value
        if (!value) {
          // logD(mod, fun, 'searching this term')
          returnedFilter[QUERY_SEARCH_TERMS].push(key)
        } else {
          try {
            const obj = JSON.parse(val)
            logD(mod, fun, `parsed String: ${beautify(obj)}`)

            switch (key) {
              case `${DB_CREATED_AT}`:
              case `${DB_UPDATED_AT}`:
              case `${DB_PUBLISHED_AT}`:

              case `${DATA_DATES}${API_DATES_CREATED}`:
              case `${DATA_DATES}${API_DATES_EDITED}`:
              case `${DATA_DATES}${API_DATES_PUBLISHED}`:
              case `${DATA_DATES}${API_DATES_VALIDATED}`:
              case `${DATA_DATES}${API_DATES_DELETED}`:

              case `${META_DATES}${API_DATES_CREATED}`:
              case `${META_DATES}${API_DATES_EDITED}`:
              case `${META_DATES}${API_DATES_PUBLISHED}`:
              case `${META_DATES}${API_DATES_VALIDATED}`:
              case `${META_DATES}${API_DATES_DELETED}`:

              case `${API_PERIOD_PROPERTY}.${API_START_DATE_PROPERTY}`:
              case `${API_PERIOD_PROPERTY}.${API_END_DATE_PROPERTY}`:
                filters.push({ [key]: cleanDateOperations(obj) })
                break
              default:
                filters.push({ [key]: obj })
            }
          } catch (err) {
            // logD(mod, fun, `Error while parsing: '${beautify(val)}': ${err}}`)
            switch (key) {
              case `${DB_CREATED_AT}`:
              case `${DB_UPDATED_AT}`:
              case `${DB_PUBLISHED_AT}`:

              case `${DATA_DATES}${API_DATES_CREATED}`:
              case `${DATA_DATES}${API_DATES_EDITED}`:
              case `${DATA_DATES}${API_DATES_PUBLISHED}`:
              case `${DATA_DATES}${API_DATES_VALIDATED}`:
              case `${DATA_DATES}${API_DATES_DELETED}`:
              case `${DATA_DATES}${API_DATES_EXPIRES}`:

              case `${META_DATES}${API_DATES_CREATED}`:
              case `${META_DATES}${API_DATES_EDITED}`:
              case `${META_DATES}${API_DATES_PUBLISHED}`:
              case `${META_DATES}${API_DATES_VALIDATED}`:
              case `${META_DATES}${API_DATES_DELETED}`:
              case `${META_DATES}${API_DATES_EXPIRES}`:

              case `${API_PERIOD_PROPERTY}.${API_START_DATE_PROPERTY}`:
              case `${API_PERIOD_PROPERTY}.${API_END_DATE_PROPERTY}`:
                filters.push({ [key]: cleanDate(val) })
                break
              case `${API_KEYWORDS_PROPERTY}`:
                filters.push({ [key]: { $in: val.split(',') } })
                break
              default:
                filters.push({ [key]: val })
            }
          }
        }
      } else {
        const indexSeparator = key.indexOf('.')
        const nestedField = key.substring(0, indexSeparator)
        const nestedFieldProp = key.substring(indexSeparator + 1)

        if (modelProperties.includes(nestedField)) {
          try {
            const obj = JSON.parse(value) // TODO: remove !!!
            const msg = `nestedField: ${nestedField} / nestedFieldProp: ${nestedFieldProp} / value: ${obj}`
            logD(mod, fun, msg)

            returnedFilter[EXT_REFS].push({
              [EXT_OBJ]: nestedField,
              [EXT_OBJ_PROP]: nestedFieldProp,
              [EXT_OBJ_VAL]: obj,
            })
          } catch (err) {
            // const errMsg = `Couldn't parse: '${beautify(value)}': ${err}}`
            // logW(mod, fun, errMsg)
            if (!value) returnedFilter[QUERY_SEARCH_TERMS].push(nestedField)
            else
              returnedFilter[EXT_REFS].push({
                [EXT_OBJ]: nestedField,
                [EXT_OBJ_PROP]: nestedFieldProp,
                [EXT_OBJ_VAL]: value,
              })
          }
        } else {
          if (searching) {
            logD(mod, fun, `Search term found: ${beautify(key)}`)
            key.split(',').map((term) => returnedFilter[QUERY_SEARCH_TERMS].push(term))
          } else {
            logW(mod, fun, `Key is not a property of ${objectType}: ${beautify(key)}`)
          }
          // logW(mod, fun, `Model properties: ${beautify(modelProperties)}`)
        }
      }
    }
    // logD(mod, fun, `filterReturn: ${beautify(filterReturn)}`)

    const extRefs = returnedFilter[EXT_REFS]
    if (isNotEmptyArray(extRefs)) {
      await Promise.all(
        extRefs.map(async (extRef) => {
          const extObj = extRef[EXT_OBJ]
          const extObjProp = extRef[EXT_OBJ_PROP]
          const extObjVal = extRef[EXT_OBJ_VAL]

          const objFilter = { [extObjProp]: extObjVal }

          // logD(mod, fun, `objFilter: ${beautify(objFilter)}`)
          let nestedFieldIds
          try {
            nestedFieldIds = await getNestedObject(objectType, extObj, objFilter, DB_ID)
          } catch (err) {
            // returnedFilter[QUERY_FILTER][extObj] = 0
            throw RudiError.treatError(mod, fun, err)
          }
          // logD(mod, fun, `nestedFieldIds: ${beautify(nestedFieldIds)}`)

          const ids = await Promise.all(
            nestedFieldIds.map(async (foundObj) => {
              // logD(mod, fun, `nestedFieldId: ${beautify(foundObj[DB_ID])}`)
              return new mongoose.Types.ObjectId(foundObj[DB_ID])
            })
          )

          filters.push({ [extObj]: mongoose.trusted({ $in: ids }) })

          // logD(mod, fun, `filterReturn: ${beautify(returnedFilter)}`)
        })
      )
    }
    if (isNotEmptyArray(filters)) returnedFilter[QUERY_FILTER] = { $and: filters }
    // logD(mod, fun, `filter: ${beautify(returnedFilter[QUERY_FILTER])}`)
    return returnedFilter
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

function getObjectParam(req) {
  const fun = 'getObjectParam'
  try {
    const objectType = accessReqParam(req, PARAM_OBJECT)
    try {
      checkIsUrlObject(objectType)
    } catch (err) {
      const error = new NotFoundError(`Route '${req.method} ${req.url}' not found `)
      throw RudiError.treatError(mod, fun, error)
    }
    return objectType
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

function checkIsUrlObject(objectType) {
  const fun = 'checkIsUrlObject'
  logT(mod, fun, beautify(URL_OBJECTS))
  if (URL_OBJECTS.indexOf(objectType) === -1)
    throw new NotFoundError(objectTypeNotFound(objectType))
}

async function newObject(objectType, objectData) {
  const fun = 'newObject'

  try {
    // checkIsUrlObject(objectType)

    switch (objectType) {
      case OBJ_METADATA:
        return await newMetadata(objectData)
      case OBJ_ORGANIZATIONS:
        return await newOrganization(objectData)
      case OBJ_CONTACTS:
        return await newContact(objectData)
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
    throw RudiError.treatError(mod, fun, err)
  }
}

async function isObjectReferenced(objectType, rudiId) {
  const fun = 'isObjectReferenced'

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
}

export const setPublishedFlag = async (dbObject, rudiId) => {
  const fun = 'setPublishedFlag'
  logD(mod, fun, '')
  try {
    if (!dbObject) throw new ParameterExpectedError('dbObject', mod, fun)
    if (!dbObject[DB_PUBLISHED_AT]) {
      dbObject[DB_PUBLISHED_AT] = nowISO()
      await dbObject.save()
      logD(mod, fun, `dbObject published: ${logMetadata(dbObject)}`)
    } else {
      logI(mod, fun, `Data had already been published for id '${rudiId}'`)
    }
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

// ------------------------------------------------------------------------------------------------
// Controllers
// ------------------------------------------------------------------------------------------------

/**
 * Add a new object
 * => POST /{object}/{id}
 */
export const addSingleObject = async (req, reply) => {
  const fun = 'addSingleObject'
  logT(mod, fun, `< POST ${URL_PV_OBJECT_GENERIC}`)
  try {
    // retrieve url parameters: object type
    const objectType = getObjectParam(req, PARAM_OBJECT)

    // get the rudiId field for this object type
    const idField = getObjectIdField(objectType)
    // accessing the request body
    const rudiObject = req.body

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

    const context = CallContext.getCallContextFromReq(req)
    if (context) context.addObjId(objectType, rudiId)

    return createdObject
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

    return await getManyObjects(objectType, req, reply)
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
    const opt = req.context?.config ? req.context.config[ROUTE_OPT] : undefined
    logD(mod, fun, `opt: ${beautify(opt)}`)

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
      QUERY_LIMIT,
      QUERY_OFFSET,
      QUERY_SORT_BY,
      QUERY_FILTER,
      QUERY_FIELDS,
      QUERY_SEARCH_TERMS,
      QUERY_COUNT_BY,
    ])

    if (opt === ACT_EXT_SEARCH) {
      const extendedSearchTerms = await widenSearch(options[QUERY_SEARCH_TERMS])
      logD(mod, fun, `extendedSearchTerms: ${extendedSearchTerms}`)
      options[QUERY_SEARCH_TERMS].push(extendedSearchTerms)
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
  logT(mod, fun, ``)

  const rudiObjectList = getRudiObjectList()
  const getSearchableFields = {}
  // logD(mod, fun, `rudiObjectList: ${beautify(rudiObjectList)}`)
  Object.keys(rudiObjectList).map((objectType) => {
    try {
      getSearchableFields[objectType] = rudiObjectList[objectType].Model.getSearchableFields()
    } catch (err) {
      logD(mod, fun, `${objectType}: not searchable`)
    }
  })
  return getSearchableFields
}

/**
 * Get several objects for a particular object type
 */
export const getManyObjects = async (objectType, req) => {
  const fun = 'getManyObjects'
  try {
    logT(mod, fun, ``)
    let parsedParameters
    try {
      parsedParameters = await parseQueryParameters(objectType, req.url)
    } catch (err) {
      logW(mod, fun, err)
      return []
    }
    // logD(mod, fun, beautify(parsedParameters))

    const countBy = parsedParameters[QUERY_COUNT_BY]
    const groupBy = parsedParameters[QUERY_GROUP_BY]

    // accessing the objects
    let objectList
    if (!countBy && !groupBy) {
      const options = pick(parsedParameters, [
        QUERY_LIMIT,
        QUERY_OFFSET,
        QUERY_SORT_BY,
        QUERY_FILTER,
        QUERY_FIELDS,
      ])
      objectList = await getDbObjectList(objectType, options)
    } else if (groupBy) {
      if (countBy) {
        const msg = `'${QUERY_GROUP_BY}' parameter found, '${QUERY_COUNT_BY}' is redondant and ignored`
        logW(mod, fun, msg)
      }
      const options = pick(parsedParameters, [
        QUERY_LIMIT,
        QUERY_OFFSET,
        QUERY_FILTER,
        QUERY_FIELDS,
        QUERY_SORT_BY,
        QUERY_GROUP_LIMIT,
        QUERY_GROUP_OFFSET,
      ])
      objectList = await groupObjectList(objectType, groupBy, options)
    } else {
      // if( !!countBy)
      const options = pick(parsedParameters, [
        QUERY_LIMIT,
        QUERY_OFFSET,
        QUERY_FILTER,
        QUERY_FIELDS,
      ])

      objectList = await countObjectList(objectType, countBy, options)
    }
    // logD(mod, fun, `objectList: ${beautify(objectList)}`)

    return objectList
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
    objectList = await getMetadataListAndCount(options)
    return objectList
  } catch (err) {
    const error = err.name === MONGO_ERROR ? new BadRequestError(err) : new NotFoundError(err)
    throw RudiError.treatError(mod, fun, error)
  }
}

export const getManyPubKeys = async (req, reply) => {
  const fun = 'getPubKeys'
  try {
    logT(mod, fun, ``)
    return await getManyObjects(OBJ_PUB_KEYS, req)
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

/**
 * Update an existing object (obsolete)
 * => PUT /{object}
 *  (obsolete)
 */
export const updateSingleObject = async (req, reply) => {
  const fun = 'updateSingleObject'
  logT(mod, fun, `< PUT ${URL_PV_OBJECT_GENERIC}`)
  try {
    // retrieve url parameters: object type, object id
    const objectType = getObjectParam(req)
    const idField = getObjectIdField(objectType)

    const updateData = req.body

    // retrieve url parameters: object type, object id
    const rudiId = accessProperty(updateData, idField)

    const existsObject = await doesObjectExistWithRudiId(objectType, rudiId)
    if (!existsObject) throw new ObjectNotFoundError(objectType, rudiId)

    const context = CallContext.getCallContextFromReq(req)

    if (objectType === OBJ_METADATA) {
      if (context) context.addMetaId(rudiId)
      return await overwriteMetadata(updateData)
    } else {
      if (context) context.addObjId(objectType, rudiId)
      return await overwriteObject(objectType, updateData)
    }
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

/**
 * Update an existing object or creates it if it doesn't exist
 * => PUT /{object}
 */
export const upsertSingleObject = async (req, reply) => {
  const fun = 'upsertSingleObject'
  logT(mod, fun, `< PUT ${URL_PV_OBJECT_GENERIC}`)
  try {
    // retrieve url parameters: object type, object id
    const objectType = getObjectParam(req)
    const idField = getObjectIdField(objectType)

    const updateData = req.body

    // retrieve url parameters: object type, object id
    const rudiId = accessProperty(updateData, idField)

    const existsObject = await doesObjectExistWithRudiId(objectType, rudiId)

    const context = CallContext.getCallContextFromReq(req)
    if (!existsObject) {
      if (context) context.addObjId(objectType, rudiId)

      return await newObject(objectType, updateData)
    } else {
      if (objectType === OBJ_METADATA) {
        if (context) context.addMetaId(rudiId)
        return await overwriteMetadata(updateData)
      } else if (objectType === OBJ_PUB_KEYS) {
        if (context) context.addObjId(objectType, rudiId)
        return await overwritePubKey(updateData)
      } else {
        if (context) context.addObjId(objectType, rudiId)
        return await overwriteObject(objectType, updateData)
      }
    }
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
  logT(mod, fun, `< DELETE ${URL_PV_OBJECT_GENERIC}/:${PARAM_ID}`)
  try {
    // retrieve url parameters: object type, object id
    const objectType = getObjectParam(req)
    const rudiId = accessReqParam(req, PARAM_ID)

    // ensure the object exists
    await getEnsuredObjectWithRudiId(objectType, rudiId)

    if (await isObjectReferenced(objectType, rudiId))
      throw new ForbiddenError(objectNotDeletedBecauseUsed(objectType, rudiId))

    // TODO: if SkosScheme: delete all SkosConcepts that reference it
    // TODO: if SkosConcept: update all other SkosConcepts that reference it (parents/children/siblings/relatives)
    const answer = await deleteObject(objectType, rudiId)

    if (objectType === OBJ_METADATA) {
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
  logT(mod, fun, `< POST ${URL_PV_OBJECT_GENERIC}/${ACT_DELETION}`)
  try {
    // retrieve url parameters: object type, object id
    const objectType = getObjectParam(req)

    // identify object model
    // const { Model, idField } = getObjectAccesses(objectType)

    // TODO: retrieve the metadata ids, DELETE on portal side with
    // deletePortalMetadata(id)

    // retrieve incoming data
    const filter = req.body
    logD(mod, fun, beautify(filter))
    let deletionResult
    if (Array.isArray(filter)) {
      deletionResult = await deleteManyWithRudiIds(objectType, filter)
    } else {
      deletionResult = await deleteManyWithFilter(objectType, filter)
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
  logT(mod, fun, `< DELETE ${URL_PV_OBJECT_GENERIC}`)
  try {
    const objectType = getObjectParam(req)
    let parsedParameters = await parseQueryParameters(objectType, req.url)
    logD(mod, fun, `parsedParameters: ${beautify(parsedParameters)}`)
    const filter = parsedParameters[QUERY_FILTER]
    // const fields = parsedParameters[QUERY_FIELDS]
    const confirmation = parsedParameters[QUERY_CONFIRM] || false

    if (isEmptyObject(filter)) {
      if (confirmation) return await deleteAll(objectType)
      else {
        const msg = `Use confirm=true as a parameter to confirm the deletion of all ${objectType}`
        logW(mod, fun, msg)
        throw new BadRequestError(msg, mod, fun)
      }
    }
    // TODO: retrieve the metadata ids, DELETE on portal side with
    // deletePortalMetadata(id)

    return await deleteManyWithFilter(objectType, filter)
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

/**
 * Generate an UUID v4
 */
export const getOrphans = async (objectType) => {
  const fun = 'getUnlinkdedObjects'
  logT(mod, fun, `< GET ${URL_PV_OBJECT_GENERIC}/${ACT_UNLINKED}`)

  return await getOrphans(objectType)
}

/**
 * Generate an UUID v4
 */
export const generateUUID = async (req, reply) => {
  const fun = 'generateUUID'
  logT(mod, fun, ``)
  try {
    return UUIDv4()
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}
