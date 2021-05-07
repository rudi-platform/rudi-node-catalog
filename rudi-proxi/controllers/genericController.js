/* eslint-disable no-unused-vars */
'use strict'

const mod = 'genCtrl'
/*
 * In this file are made the different steps followed for each
 * action on the objects (producer or publisher)
 */

// ---------------------------------------------------------------
// External dependancies
// ---------------------------------------------------------------
const boom = require('@hapi/boom')
const uuid = require('uuid')
// const url = require('url')
const _ = require('lodash')
const {
  indexOf,
  isArray
} = require('lodash')

// ---------------------------------------------------------------
// Internal dependancies
// ---------------------------------------------------------------
const log = require('../utils/logging')
const msg = require('../utils/msg')

const sys = require('../config/confSystem')

const db = require('../db/dbQueries')

const json = require('../utils/jsonAccess')
const utils = require('../utils/jsUtils')

// ---------------------------------------------------------------
// Constants
// ---------------------------------------------------------------

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
  QUERY_LIMIT,
  QUERY_LIMIT_DEFAULT,
  QUERY_OFFSET,
  QUERY_OFFSET_DEFAULT,
  QUERY_FILTER,
  QUERY_GROUP_BY,
  QUERY_COUNT_BY,
  URL_ACTION_FILTER,
  URL_OBJECTS
} = require('../config/confApi')

const {
  DB_PUBLISHED_AT,
  DB_ID
} = require('../db/dbFields')

// ---------------------------------------------------------------
// Models
// ---------------------------------------------------------------

const Organization = require('../definitions/models/Organization')
const Contact = require('../definitions/models/Contact')
const Report = require('../definitions/models/Report')
const SkosConcept = require('../definitions/models/SkosConcept')
const SkosScheme = require('../definitions/models/SkosScheme')
/* beautify ignore:start */
const { Metadata } = require('../definitions/models/Metadata')
const { Media, MediaFile, MediaSeries } = require('../definitions/models/Media')
/* beautify ignore:end */

// ---------------------------------------------------------------
// Specific controlelrs
// ---------------------------------------------------------------
const metadataController = require('../controllers/metadataController')
const organizationController = require('../controllers/organizationController')
const contactController = require('../controllers/contactController')
const skosController = require('./skosController')

// ---------------------------------------------------------------
// Specific object type helper functions
// ---------------------------------------------------------------
const QUERY_RESERVED_WORDS = [
  QUERY_LIMIT,
  QUERY_OFFSET
]

const EXT_REFS = 'external_references' // External references needing aggregation
const EXT_OBJ = 'refObj'
const EXT_OBJ_PROP = 'refObjProp'
const EXT_OBJ_VAL = 'refObjVal'

async function parseQueryParameters(objectType, urlSearchParams) {
  const fun = 'parseQueryParameters'
  // identify object model
  const Model = db.getObjectModel(objectType)
  const modelProperties = db.getModelPropertyNames(Model)

  const returnedFilter = {}
  returnedFilter[QUERY_LIMIT] = QUERY_LIMIT_DEFAULT
  returnedFilter[QUERY_OFFSET] = QUERY_OFFSET_DEFAULT
  returnedFilter[QUERY_FILTER] = {}
  returnedFilter[EXT_REFS] = []

  for (const [key, value] of urlSearchParams) {
    if (QUERY_RESERVED_WORDS.includes(key)) {
      // log.d(mod, fun, `Key is a reserved word: ${json.beautify(key)} => ${json.beautify(queryParameters[key])}`)
      switch (key) {
        case QUERY_LIMIT:
          returnedFilter[QUERY_LIMIT] = parseInt(value)
          // log.d(mod, fun, `Limit: ${json.beautify(filterReturn[QUERY_LIMIT])}`)
          break
        case QUERY_OFFSET:
          returnedFilter[QUERY_OFFSET] = parseInt(value)
          // log.d(mod, fun, `Offset: ${json.beautify(filterReturn[QUERY_OFFSET])}`)
          break
        default:
          log.w(mod, fun, `Query keyword not recognized: '${key}'`)
      }
    } else if (modelProperties.includes(key)) {
      // log.d(mod, fun, `Key is a ${objectType} property: ${json.beautify(key)}`)
      const val = value
      try {
        const obj = JSON.parse(val)
        // log.d(mod, fun, `parsed String: ${json.beautify(obj)}`)
        returnedFilter[QUERY_FILTER][key] = obj
      } catch (err) {
        const errMsg = `Error while parsing: '${json.beautify(val)}': ${err}}`
        log.w(mod, fun, errMsg)
        throw new Error(errMsg)
      }
    } else {
      const indexSeparator = key.lastIndexOf('.')
      const nestedField = key.substring(0, indexSeparator)
      const nestedFieldProp = key.substring(indexSeparator + 1)

      if (modelProperties.includes(nestedField)) {
        try {
          const obj = JSON.parse(value)
          log.d(mod, fun, `nestedField: ${nestedField} / nestedFieldProp: ${nestedFieldProp} / value: ${obj}`)

          returnedFilter[EXT_REFS].push({
            [EXT_OBJ]: nestedField,
            [EXT_OBJ_PROP]: nestedFieldProp,
            [EXT_OBJ_VAL]: obj
          })
        } catch (err) {
          const errMsg = `Couldn't parse: '${json.beautify(value)}': ${err}}`
          log.w(mod, fun, errMsg)
          throw new Error(errMsg)
        }
      } else {
        log.w(mod, fun, `Key is unkown and ignored: ${json.beautify(key)}`)
        // log.w(mod, fun, `Model properties: ${json.beautify(modelProperties)}`)
      }
    }
  }
  // log.d(mod, fun, `filterReturn: ${json.beautify(filterReturn)}`)

  const extRefs = returnedFilter[EXT_REFS]
  if (utils.isNotEmptyArray(extRefs)) {
    await Promise.all(extRefs.map(async (extRef) => {
      const extObj = extRef[EXT_OBJ]
      const extObjProp = extRef[EXT_OBJ_PROP]
      const extObjVal = extRef[EXT_OBJ_VAL]
      /* beautify ignore:start */
      const objFilter = { [extObjProp]: extObjVal }
      /* beautify ignore:end */
      log.d(mod, fun, `objFilter: ${json.beautify(objFilter)}`)
      const nestedFieldIds = await db.getNestedObject(objectType, extObj, objFilter, DB_ID)
      let queryFilter
      if (utils.isNotEmptyArray(nestedFieldIds)) {
        const ids = []
        await Promise.all(nestedFieldIds.map(async (foundObj) => {
          log.d(mod, fun, `nestedFieldId: ${json.beautify(foundObj[DB_ID])}`)
          ids.push(foundObj[DB_ID])
        }))
        /* beautify ignore:start */
        returnedFilter[QUERY_FILTER][extObj] = { $in: [ids.join(',')] }
        /* beautify ignore:end */
        log.d(mod, fun, `filterReturn: ${json.beautify(returnedFilter)}`)
      } else {
        returnedFilter[QUERY_FILTER][extObj] = 0
      }
    }))
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
    log.d(mod, fun, `dbObject published: ${json.beautify(dbObject)}`)
  } else {
    log.w(mod, fun, `Data was already published on : ${(dbObject[DB_PUBLISHED_AT])}`)
  }
}

// ---------------------------------------------------------------
// Controllers
// ---------------------------------------------------------------

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
    // log.d(mod, fun, `objectType: '${objectType}', incomingData: '${json.beautify(rudiObject)}' `)
    const rudiId = json.accessProperty(rudiObject, idField)

    // First: we make sure object doesn't exist already
    const existsObject = await db.doesObjectExistWithJson(objectType, rudiObject)
    if (existsObject) throw new Error(`${msg.objectAlreadyExists(objectType, rudiId)}`)

    // Creating new object + specific treatments
    const createdObject = await newObject(objectType, rudiObject)

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

    // retrieve query parameters: 'limit' and 'offset'
    const limit = parseInt(req.query[QUERY_LIMIT]) || QUERY_LIMIT_DEFAULT
    const offset = parseInt(req.query[QUERY_OFFSET]) || QUERY_OFFSET_DEFAULT
    const filter = req.query[QUERY_FILTER]
    const groupBy = req.query[QUERY_GROUP_BY]
    const countBy = req.query[QUERY_COUNT_BY]

    // accessing the objects
    let objectList
    if (!countBy && !groupBy) {
      objectList = await db.getObjectList(objectType, limit, offset, filter)
    } else if (groupBy) {
      objectList = await db.getObjectListGroup(objectType, groupBy, limit, offset)
    } else { // if( !!countBy) {
      objectList = await db.getObjectListCount(objectType, countBy, limit, offset)
    }
    // log.d(mod, fun, `objectList: ${json.beautify(objectList)}`)

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
  log.v(mod, fun, `< GET ${URL_OBJECT_GENERIC}/${URL_ACTION_FILTER}`)
  try {
    // retrieve url parameter: object type
    const objectType = json.accessReqParam(req, PARAM_OBJECT)

    // retrieve url query parameters
    const reqSearch = req.url.substring(req.url.indexOf('?'))
    const parsedParameters = await parseQueryParameters(objectType, new URLSearchParams(reqSearch))

    const limit = parsedParameters[QUERY_LIMIT]
    const offset = parsedParameters[QUERY_OFFSET]
    const filter = parsedParameters[QUERY_FILTER]

    return await db.getObjectList(objectType, limit, offset, filter)
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

    /* beautify ignore:start */
    // identify object model
    const { Model, idField } = db.getObjectAccesses(objectType)
    /* beautify ignore:end */

    // retrieve incoming data
    const filter = req.body
    log.d(mod, fun, json.beautify(filter))
    let deletionResult
    if (Array.isArray(filter)) {
      deletionResult = await db.deleteManyWithRudiIds(objectType, filter)
    } else {
      deletionResult = await db.deleteManyWithFilter(objectType, filter)
    }
    return deletionResult
  } catch (err) {
    log.e(mod, fun, err)
    log.e(mod, fun, `method: ${json.beautify(req.method)}`)
    log.e(mod, fun, `url: ${json.beautify(req.url)}`)
    log.e(mod, fun, `params: ${json.beautify(req.params)}`)
    log.e(mod, fun, `body: ${json.beautify(req.body)}`)
    throw boom.boomify(err)
  }
}

/**
 * Delete every object
 * => DELETE /{object}
 */
exports.deleteEveryObject = async (req, reply) => {
  const fun = 'deleteEveryObject'
  log.v(mod, fun, `< DELETE ${URL_OBJECT_GENERIC}`)
  try {
    const objectType = json.accessReqParam(req, PARAM_OBJECT)
    return await db.deleteAll(objectType)
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
