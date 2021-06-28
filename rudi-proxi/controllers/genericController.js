/* eslint-disable no-unused-vars */
'use strict'

const mod = 'genCtrl'
/*
 * In this file are made the different steps followed for each
 * action on the objects (producer or publisher)
 */

// -----------------------------------------------------------------------------
// External dependancies
// -----------------------------------------------------------------------------
const boom = require('@hapi/boom')
const uuid = require('uuid')
// const url = require('url')
const { pick } = require('lodash')

// -----------------------------------------------------------------------------
// Internal dependancies
// -----------------------------------------------------------------------------
const log = require('../utils/logging')
const msg = require('../utils/msg')

const sys = require('../config/confSystem')

const db = require('../db/dbQueries')

const json = require('../utils/jsonAccess')
const utils = require('../utils/jsUtils')

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const {
  URL_OBJECT_GENERIC,
  URL_OBJECT_METADATA,
  URL_OBJECT_ORGANIZATIONS,
  URL_OBJECT_CONTACTS,
  URL_OBJECT_MEDIA,
  URL_OBJECT_SKOS_CONCEPT,
  URL_OBJECT_SKOS_SCHEME,
  URL_ACTION_REPORT,
  URL_ACTION_DELETION,
  PARAM_ID,
  PARAM_OBJECT,

  QUERY_FIELDS,
  QUERY_LIMIT,
  QUERY_OFFSET,

  QUERY_LIMIT_DEFAULT,
  QUERY_OFFSET_DEFAULT,
  QUERY_FILTER,
  QUERY_SORT_BY,
  QUERY_COUNT_BY,
  QUERY_GROUP_BY,
  QUERY_GROUP_LIMIT,
  QUERY_GROUP_OFFSET,

  URL_ACTION_FILTER,
  URL_OBJECTS,
  QUERY_CONFIRM,
} = require('../config/confApi')

const {
  DB_PUBLISHED_AT,
  DB_ID,
  API_METAINFO_PROPERTY,
  API_METAINFO_DATES_PROPERTY,
  API_DATES_CREATED_PROPERTY,
  API_DATES_EDITED_PROPERTY,
  DB_UPDATED_AT,
  API_DATES_PUBLISHED_PROPERTY,
  DB_CREATE_AT,
} = require('../db/dbFields')

// -----------------------------------------------------------------------------
// Models
// -----------------------------------------------------------------------------

const Organization = require('../definitions/models/Organization')
const Contact = require('../definitions/models/Contact')
const Report = require('../definitions/models/Report')
const SkosConcept = require('../definitions/models/SkosConcept')
const SkosScheme = require('../definitions/models/SkosScheme')

const { Metadata } = require('../definitions/models/Metadata')
const { Media, MediaFile, MediaSeries } = require('../definitions/models/Media')

// -----------------------------------------------------------------------------
// Specific controllers
// -----------------------------------------------------------------------------
const metadataController = require('../controllers/metadataController')
const organizationController = require('../controllers/organizationController')
const contactController = require('../controllers/contactController')
const skosController = require('./skosController')

// -----------------------------------------------------------------------------
// Specific object type helper functions
// -----------------------------------------------------------------------------
const QUERY_RESERVED_WORDS = [
  QUERY_LIMIT,
  QUERY_OFFSET,
  QUERY_FIELDS,
  QUERY_SORT_BY,
  QUERY_COUNT_BY,
  QUERY_GROUP_BY,
  QUERY_GROUP_LIMIT,
  QUERY_GROUP_OFFSET,
  QUERY_CONFIRM,
]

const EXT_REFS = 'external_references' // External references needing aggregation
const EXT_OBJ = 'refObj'
const EXT_OBJ_PROP = 'refObjProp'
const EXT_OBJ_VAL = 'refObjVal'

async function parseQueryParameters(objectType, reqUrl) {
  const fun = 'parseQueryParameters'

  // identify object model
  const Model = db.getObjectModel(objectType)
  const modelProperties = db.getModelPropertyNames(Model)

  const returnedFilter = {
    [QUERY_LIMIT]: QUERY_LIMIT_DEFAULT,
    [QUERY_GROUP_LIMIT]: QUERY_LIMIT_DEFAULT,
    [QUERY_OFFSET]: QUERY_OFFSET_DEFAULT,
    [QUERY_GROUP_OFFSET]: QUERY_OFFSET_DEFAULT,
    [QUERY_FILTER]: {},
    [QUERY_CONFIRM]: false,
    [EXT_REFS]: [],
  }

  // extract request parameters
  if (reqUrl.indexOf('?') === -1) {
    log.d(mod, fun, `No question mark was found in url: ${reqUrl}`)
    return returnedFilter
  }
  const reqSearch = reqUrl.substring(reqUrl.indexOf('?'))
  // log.d(mod, fun, `reqSearch: ${reqSearch}`)
  const urlSearchParams = new URLSearchParams(reqSearch)

  // Check if parameters were actually found by URLSearchParams
  if (urlSearchParams.keys().length < 1) {
    log.d(mod, fun, `No parameters found after the question mark: ${urlSearchParams}`)
    return returnedFilter
  }
  //  log.d(mod, fun, `urlSearchParams: ${urlSearchParams}`)

   for (const [key, value] of urlSearchParams) {
    if (QUERY_RESERVED_WORDS.includes(key)) {
      // log.d(mod, fun, `Key is a reserved word: ${utils.beautify(key)} => ${utils.beautify(queryParameters[key])}`)
      switch (key) {
        case QUERY_LIMIT:
        case QUERY_OFFSET:
        case QUERY_GROUP_LIMIT:
        case QUERY_GROUP_OFFSET:
          returnedFilter[key] = parseInt(value)
          break
        case QUERY_GROUP_BY:
        case QUERY_COUNT_BY:
          returnedFilter[key] = value
          break
        case QUERY_CONFIRM:
          if (['false', '0', 'null', 'no'].includes(value)) break
          returnedFilter[key] = !!value
          break
        case QUERY_FIELDS:
          returnedFilter[key] = value.split(',').map((field) => field.trim())
          break
        case QUERY_SORT_BY:
          returnedFilter[key] = value.split(',').map((field) => {
            let trimmedField = field.trim()
            let minus = ''
            let absoluteField = trimmedField
            if (trimmedField[0] === '-') {
              minus = '-'
              absoluteField = trimmedField.substring(1)
            }
            // Dealing with virtual fields
            const metaDates = `${API_METAINFO_PROPERTY}.${API_METAINFO_DATES_PROPERTY}.`
            switch (absoluteField) {
              case `${metaDates}${API_DATES_CREATED_PROPERTY}`:
                return `${minus}${DB_CREATE_AT}`
              case `${metaDates}${API_DATES_EDITED_PROPERTY}`:
                return `${minus}${DB_UPDATED_AT}`
              case `${metaDates}${API_DATES_PUBLISHED_PROPERTY}`:
                return `${minus}${DB_PUBLISHED_AT}`
              default:
                return trimmedField
            }
          })
          break
        default:
          log.w(mod, fun, `Query keyword not recognized: '${key}'`)
      }
    } else if (modelProperties.includes(key)) {
      // log.d(mod, fun, `Key is a ${objectType} property: ${utils.beautify(key)}`)
      const val = value
      try {
        const obj = JSON.parse(val)
        // log.d(mod, fun, `parsed String: ${utils.beautify(obj)}`)
        returnedFilter[QUERY_FILTER][key] = obj
      } catch (err) {
        const errMsg = `Error while parsing: '${utils.beautify(val)}': ${err}}`
        // log.w(mod, fun, errMsg)
        returnedFilter[QUERY_FILTER][key] = val
        // throw new Error(errMsg)
      }
    } else {
      const indexSeparator = key.indexOf('.')
      const nestedField = key.substring(0, indexSeparator)
      const nestedFieldProp = key.substring(indexSeparator + 1)

      if (modelProperties.includes(nestedField)) {
        try {
          const obj = JSON.parse(value)
          log.d(
            mod,
            fun,
            `nestedField: ${nestedField} / nestedFieldProp: ${nestedFieldProp} / value: ${obj}`
          )

          returnedFilter[EXT_REFS].push({
            [EXT_OBJ]: nestedField,
            [EXT_OBJ_PROP]: nestedFieldProp,
            [EXT_OBJ_VAL]: obj,
          })
        } catch (err) {
          const errMsg = `Couldn't parse: '${utils.beautify(value)}': ${err}}`
          log.w(mod, fun, errMsg)
          throw new Error(errMsg)
        }
      } else {
        log.w(mod, fun, `Key is unkown and ignored for ${objectType}: ${utils.beautify(key)}`)
        // log.w(mod, fun, `Model properties: ${utils.beautify(modelProperties)}`)
      }
    }
  }
  // log.d(mod, fun, `filterReturn: ${utils.beautify(filterReturn)}`)

  const extRefs = returnedFilter[EXT_REFS]
  if (utils.isNotEmptyArray(extRefs)) {
    await Promise.all(
      extRefs.map(async (extRef) => {
        const extObj = extRef[EXT_OBJ]
        const extObjProp = extRef[EXT_OBJ_PROP]
        const extObjVal = extRef[EXT_OBJ_VAL]

        const objFilter = { [extObjProp]: extObjVal }

        log.d(mod, fun, `objFilter: ${utils.beautify(objFilter)}`)
        let nestedFieldIds
        try {
          nestedFieldIds = await db.getNestedObject(objectType, extObj, objFilter, DB_ID)
        } catch (err) {
          log.w(mod, fun, err)
          // returnedFilter[QUERY_FILTER][extObj] = 0
          throw err
        }
        let queryFilter

        const ids = []
        await Promise.all(
          nestedFieldIds.map(async (foundObj) => {
            log.d(mod, fun, `nestedFieldId: ${utils.beautify(foundObj[DB_ID])}`)
            ids.push(foundObj[DB_ID])
          })
        )

        returnedFilter[QUERY_FILTER][extObj] = { $in: [ids.join(',')] }

        log.d(mod, fun, `filterReturn: ${utils.beautify(returnedFilter)}`)
      })
    )
  }
  return returnedFilter
}

function checkIsUrlObject(objectType) {
  if (URL_OBJECTS.indexOf(objectType) === -1) throw new Error(msg.objectTypeNotFound(objectType))
}

async function newObject(objectType, objectData) {
  const fun = 'newObject'

  try {
    checkIsUrlObject(objectType)

    switch (objectType) {
      case URL_OBJECT_METADATA:
        return await metadataController.newMetadata(objectData)
      case URL_OBJECT_ORGANIZATIONS:
        return await organizationController.newOrganization(objectData)
      case URL_OBJECT_CONTACTS:
        return await contactController.newContact(objectData)
      case URL_OBJECT_SKOS_CONCEPT:
        return await skosController.newSkosConcept(objectData)
      case URL_OBJECT_SKOS_SCHEME:
        // Custom creation to create the children scheme concepts
        return await skosController.newSkosScheme(objectData)
      default:
        throw new Error(msg.objectTypeNotFound(objectType))
    }
  } catch (err) {
    log.w(mod, fun, err)
    throw err
  }
}

async function isObjectReferenced(objectType, rudiId) {
  const fun = 'isObjectReferenced'
  log.d(mod, fun, `objectType: ${objectType}`)
  checkIsUrlObject(objectType)

  switch (objectType) {
    case URL_OBJECT_ORGANIZATIONS:
    case URL_OBJECT_CONTACTS:
    case URL_OBJECT_MEDIA:
      return await db.isReferencedInMetadata(objectType, rudiId)
    default:
      return false
  }
}

exports.setPublishedFlag = async (dbObject) => {
  const fun = 'setPublishedFlag'
  log.d(mod, fun, '')
  if (!dbObject[DB_PUBLISHED_AT]) {
    dbObject[DB_PUBLISHED_AT] = utils.nowISO()
    dbObject.save()
    log.d(mod, fun, `dbObject published: ${utils.beautify(dbObject)}`)
  } else {
    log.w(mod, fun, `Data was already published on : ${dbObject[DB_PUBLISHED_AT]}`)
  }
}

// -----------------------------------------------------------------------------
// Controllers
// -----------------------------------------------------------------------------

/**
 * Add a new object
 * => POST /{object}/{id}
 */
exports.addSingleObject = async (req, reply) => {
  const fun = 'addSingleObject'
  log.v(mod, fun, `< POST ${URL_OBJECT_GENERIC}`)
  try {
    // retrieve url parameters: object type, object id
    const objectType = json.accessReqParam(req, PARAM_OBJECT)

    // get the rudiId field for this object type
    const idField = db.getObjectIdField(objectType)
    // accessing the request body
    const rudiObject = req.body

    // retrieving the id
    // log.d(mod, fun, `objectType: '${objectType}', incomingData: '${utils.beautify(rudiObject)}' `)
    const rudiId = json.accessProperty(rudiObject, idField)

    // First: we make sure object doesn't exist already
    const existsObject = await db.doesObjectExistWithJson(objectType, rudiObject)
    if (existsObject) throw new Error(`${msg.objectAlreadyExists(objectType, rudiId)}`)

    // Creating new object + specific treatments
    const createdObject = await newObject(objectType, rudiObject)
    // log.v(mod, fun, utils.beautify(createdObject, 2))
    log.i(mod, fun, `${msg.objectAdded(objectType, rudiId)}`)
    return createdObject
  } catch (err) {
    log.e(mod, fun, err)
    // reply.statusCode = 500
    // reply.message = err
    // reply.send()
    throw boom.boomify(err)
  }
}

/**
 * Get single object by ID
 * => GET /{object}/{id}
 */
exports.getSingleObject = async (req, reply) => {
  const fun = 'getSingleObject'
  log.v(mod, fun, `< GET ${URL_OBJECT_GENERIC}/:${PARAM_ID}`)
  try {
    // retrieve url parameters: object type, object id
    const objectType = json.accessReqParam(req, PARAM_OBJECT)
    const objectId = json.accessReqParam(req, PARAM_ID)

    // ensure the object exists
    const dbObject = await db.getEnsuredObjectWithRudiId(objectType, objectId)
    // return the object
    return dbObject
  } catch (err) {
    log.e(mod, fun, err)
    throw boom.boomify(err)
  }
}

/**
 * Get several objects
 * => GET /{object}
 */
exports.getObjectList = async (req, reply) => {
  const fun = 'getObjectList'
  log.v(mod, fun, `< GET ${URL_OBJECT_GENERIC}`)
  try {
    // retrieve url parameter: object type
    const objectType = json.accessReqParam(req, PARAM_OBJECT)

    let parsedParameters
    try {
      parsedParameters = await parseQueryParameters(objectType, req.url)
    } catch (err) {
      log.w(mod, fun, err)
      return []
    }

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
      objectList = await db.getObjectList(objectType, options)
    } else if (groupBy) {
      if (countBy) {
        const msg = `'${QUERY_GROUP_BY}' parameter found, '${QUERY_COUNT_BY}' is redondant and ignored`
        log.w(mod, fun, msg)
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
      objectList = await db.groupObjectList(objectType, groupBy, options)
    } else {
      // if( !!countBy)
      const options = pick(parsedParameters, [
        QUERY_LIMIT,
        QUERY_OFFSET,
        QUERY_FILTER,
        QUERY_FIELDS,
      ])

      objectList = await db.countObjectList(objectType, countBy, options)
    }
    // log.d(mod, fun, `objectList: ${utils.beautify(objectList)}`)

    return objectList
  } catch (err) {
    log.e(mod, fun, err)
    throw boom.boomify(err)
  }
}

/**
 * Get several objects from a filter query
 * => GET /{object}
 */
exports.getObjectListFiltered = async (req, reply) => {
  const fun = 'getObjectListFiltered'
  log.d(mod, fun, ``)
  // log.v(mod, fun, `< GET ${URL_OBJECT_GENERIC}/${URL_ACTION_FILTER}`)
  try {
    // retrieve url parameter: object type
    const objectType = json.accessReqParam(req, PARAM_OBJECT)

    // retrieve url query parameters
    let parsedParameters
    try {
      parsedParameters = await parseQueryParameters(objectType, req.url)
    } catch (err) {
      log.w(mod, fun, err)
      return []
    }
    const limit = parsedParameters[QUERY_LIMIT]
    const offset = parsedParameters[QUERY_OFFSET]
    const filter = parsedParameters[QUERY_FILTER]
    const fields = parsedParameters[QUERY_FIELDS]

    return await db.getObjectList(objectType, limit, offset, filter, fields)
  } catch (err) {
    log.e(mod, fun, err)
    throw boom.boomify(err)
  }
}

/**
 * Update an existing object
 * => PUT /{object}
 */
exports.updateSingleObject = async (req, reply) => {
  const fun = 'updateSingleObject'
  log.v(mod, fun, `< PUT ${URL_OBJECT_GENERIC}`)
  try {
    // retrieve url parameters: object type, object id
    const objectType = json.accessReqParam(req, PARAM_OBJECT)
    const idField = db.getObjectIdField(objectType)

    const updateData = req.body

    // retrieve url parameters: object type, object id
    const rudiId = json.accessProperty(updateData, idField)

    const existsObject = await db.doesObjectExistWithRudiId(objectType, rudiId)
    if (!existsObject) throw new Error(`${msg.objectNotFound(objectType, rudiId)}`)

    if (objectType === URL_OBJECT_METADATA) {
      return await metadataController.updateMetadata(updateData)
    } else {
      return await db.updateObject(objectType, updateData)
    }
  } catch (err) {
    log.e(mod, fun, err)
    throw boom.boomify(err)
  }
}

/**
 * Delete a single object
 * => DELETE /{object}/{id}
 */
exports.deleteSingleObject = async (req, reply) => {
  const fun = 'deleteSingleObject'
  log.v(mod, fun, `< DELETE ${URL_OBJECT_GENERIC}/:${PARAM_ID}`)
  try {
    // retrieve url parameters: object type, object id
    const objectType = json.accessReqParam(req, PARAM_OBJECT)
    const objectRudiId = json.accessReqParam(req, PARAM_ID)

    // ensure the object exists
    const objectToDelete = await db.getEnsuredObjectWithRudiId(objectType, objectRudiId)

    if (await isObjectReferenced(objectType, objectRudiId)) {
      const err = new Error(msg.objectNotDeletedBecauseUsed(objectType, objectRudiId))
      err.statusCode = 403
      throw err
    }
    // TODO: if SkosScheme: delete all SkosConcepts that reference it
    // TODO: if SkosConcept: update all other SkosConcepts that reference it (parents/children/siblings/relatives)
    return await db.deleteObject(objectType, objectRudiId)
  } catch (err) {
    log.e(mod, fun, err)
    throw boom.boomify(err)
  }
}

/**
 * Delete several objects
 * => POST /{object}/deletion
 */
exports.deleteObjectList = async (req, reply) => {
  const fun = 'deleteObjectList'
  log.v(mod, fun, `< POST ${URL_OBJECT_GENERIC}/${URL_ACTION_DELETION}`)
  try {
    // retrieve url parameters: object type, object id
    const objectType = json.accessReqParam(req, PARAM_OBJECT)

    // identify object model
    const { Model, idField } = db.getObjectAccesses(objectType)

    // retrieve incoming data
    const filter = req.body
    log.d(mod, fun, utils.beautify(filter))
    let deletionResult
    if (Array.isArray(filter)) {
      deletionResult = await db.deleteManyWithRudiIds(objectType, filter)
    } else {
      deletionResult = await db.deleteManyWithFilter(objectType, filter)
    }
    return deletionResult
  } catch (err) {
    log.e(mod, fun, err)
    log.e(mod, fun, `method: ${utils.beautify(req.method)}`)
    log.e(mod, fun, `url: ${utils.beautify(req.url)}`)
    log.e(mod, fun, `params: ${utils.beautify(req.params)}`)
    log.e(mod, fun, `body: ${utils.beautify(req.body)}`)
    throw boom.boomify(err)
  }
}

/**
 * Delete every object
 * => DELETE /{object}
 */
exports.deleteManyObjects = async (req, reply) => {
  const fun = 'deleteManyObjects'
  log.v(mod, fun, `< DELETE ${URL_OBJECT_GENERIC}`)
  try {
    const objectType = json.accessReqParam(req, PARAM_OBJECT)
    
    let parsedParameters = await parseQueryParameters(objectType, req.url)
    log.d(mod, fun, `parsedParameters: ${utils.beautify(parsedParameters)}`)
    const filter = parsedParameters[QUERY_FILTER]
    const fields = parsedParameters[QUERY_FIELDS]
    const confirmation = parsedParameters[QUERY_CONFIRM] || false

    if (utils.isEmptyObject(filter)) {
      if (confirmation) return await db.deleteAll(objectType)
      else {
        const msg = `use confirm=true as a parameter to confirm the deletion of all ${objectType}`
        log.w(mod, fun, msg)
        return msg
      }
    }

    return await db.deleteManyWithFilter(objectType, filter)
  } catch (err) {
    log.e(mod, fun, err)
    throw boom.boomify(err)
  }
}

/**
 * Generate an UUID v4
 */
exports.generateUUID = async (req, reply) => {
  const fun = 'generateUUID'
  log.d(mod, fun, '')
  try {
    return uuid.v4()
  } catch (err) {
    log.e(mod, fun, err)
    throw boom.boomify(err)
  }
}
