'use strict';

const mod = 'genCtrl'
/*
 * In this file are made the different steps followed for each 
 * action on the objects (producer or publisher)
 */

//---------------------------------------------------------------
// External dependancies 
//---------------------------------------------------------------
const boom = require('@hapi/boom')
const uuid = require('uuid')
const url = require('url');

//---------------------------------------------------------------
// Internal dependancies 
//---------------------------------------------------------------
const log = require('../utils/logging')
const msg = require('../utils/msg')

const db = require('../db/dbQueries')
const dbRwk = require('../db/dbReworkData')
const json = require('../utils/jsonAccess')
const utils = require('../utils/jsUtils')

//---------------------------------------------------------------
// Constants
//---------------------------------------------------------------

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
  URL_OBJECTS,
} = require('../config/confApi')

const {
  DB_ID,
  API_METADATA_ID,
  API_ORGANIZATION_ID,
  API_CONTACT_ID,
  API_DATA_PRODUCER_PROPERTY,
  API_DATA_CONTACTS_PROPERTY,
  API_METAINFO_PROPERTY,
  API_REPORT_ID,
  API_DATES_PUBLISHED_PROPERTY,
  API_MEDIA_ID,
  API_CONCEPT_PARENTS_PROPERTY
} = require('../db/dbFields')


//---------------------------------------------------------------
// Models
//---------------------------------------------------------------

const Organization = require('../definitions/models/Organization');
const Contact = require('../definitions/models/Contact');
const Report = require('../definitions/models/Report');
const SkosConcept = require('../definitions/models/SkosConcept');
const SkosScheme = require('../definitions/models/SkosScheme');
/* beautify ignore:start */
const { Metadata } = require('../definitions/models/Metadata');
const { Media, MediaFile, MediaSeries } = require('../definitions/models/Media');
/* beautify ignore:end */

//---------------------------------------------------------------
// Specific controlelrs
//---------------------------------------------------------------
const metadataController = require('../controllers/metadataController')
const organizationController = require('../controllers/organizationController')
const contactController = require('../controllers/contactController');
const skosController = require('./skosController');
const _ = require('lodash');

//---------------------------------------------------------------
// Specific object type helper functions
//---------------------------------------------------------------
const QUERY_RESERVED_WORDS = [
  QUERY_LIMIT,
  QUERY_OFFSET
]

function parseQueryParameters(objectType, queryParameters) {
  const fun = 'parseQueryParameters'
  // log.d(mod, fun, `queryParameters: ${json.beautify(queryParameters)}`)
  // identify object model
  /* beautify ignore:start */
  const {Model, idField} = db.getObjectAccesses(objectType)
  /* beautify ignore:end */
  const modelProperties = db.modelPropertyList(Model)

  const queryKeys = Object.keys(queryParameters)
  // log.d(mod, fun, `queryKeys: ${json.beautify(queryKeys)}`)

  let filterReturn = {}
  filterReturn[QUERY_LIMIT] = QUERY_LIMIT_DEFAULT;
  filterReturn[QUERY_OFFSET] = QUERY_OFFSET_DEFAULT;
  filterReturn[QUERY_FILTER] = {}

  queryKeys.map(key => {
    if (QUERY_RESERVED_WORDS.includes(key)) {
      // log.d(mod, fun, `Key is a reserved word: ${json.beautify(key)} => ${json.beautify(queryParameters[key])}`)
      switch (key) {
        case QUERY_LIMIT:
          filterReturn[QUERY_LIMIT] = parseInt(queryParameters[key]);
          // log.d(mod, fun, `Limit: ${json.beautify(filterReturn[QUERY_LIMIT])}`)
          break
        case QUERY_OFFSET:
          filterReturn[QUERY_OFFSET] = parseInt(queryParameters[key]);
          // log.d(mod, fun, `Offset: ${json.beautify(filterReturn[QUERY_OFFSET])}`)
          break
      }
    } else if (modelProperties.includes(key)) {
      // log.d(mod, fun, `Key is a ${objectType} property: ${json.beautify(key)}`)
      const val = queryParameters[key]
      // log.d(mod, fun, `Associated value: ${val}`)
      // log.d(mod, fun, `isObject: ${_.isObject(val)}`)
      // log.d(mod, fun, `_isString: ${_.isString(val)}`)
      try {
        const obj = JSON.parse(val)
        // log.d(mod, fun, `parsed String: ${json.beautify(obj)}`)
        filterReturn[QUERY_FILTER][key] = obj
      } catch (err) {
        const errMsg = `Error while parsing: '${json.beautify(val)}': ${err}}`
        log.w(mod, fun, errMsg)
        throw new Error(errMsg)
      }
    } else {
      log.w(mod, fun, `Key is unkown and ignored: ${json.beautify(key)}`)
    }
  })
  // log.d(mod, fun, `filterReturn: ${json.beautify(filterReturn)}`)

  return filterReturn
}

function checkIsUrlObject(objectType) {
  if (URL_OBJECTS.indexOf(objectType) == -1) throw new Error(msg.objectTypeNotFound(objectType))
}
async function newObject(objectType, objectData) {
  const fun = 'newObject'

  try {
    checkIsUrlObject(objectType)

    switch (objectType) {
      case URL_OBJECT_METADATA:
        return await metadataController.newMetadata(objectData)
        break
      case URL_OBJECT_ORGANIZATIONS:
        return await organizationController.newOrganization(objectData)
        break
      case URL_OBJECT_CONTACTS:
        return await contactController.newContact(objectData)
        break
      case URL_OBJECT_SKOS_CONCEPT:
        return await skosController.newSkosConcept(objectData)
        break
      case URL_OBJECT_SKOS_SCHEME:
        // Custom creation to create the children scheme concepts
        return await skosController.newSkosScheme(objectData)
        break
      default:
        throw new Error(msg.objectTypeNotFound(objectType))
    }
  } catch (err) {
    log.w(mod, fun, err)
    throw err
  }
}

async function getObjectListCount(objectType, countBy, limit, offset) {
  const fun = 'getObjectListCount'
  log.d(mod, fun, `objectType: ${objectType}`)
  try {
    checkIsUrlObject(objectType)

    /* beautify ignore:start */
    const {Model, idField} = db.getObjectAccesses(objectType)
    /* beautify ignore:end */

    if (!db.isProperty(Model, countBy)) {
      const errMsg = `Field ${countBy} is not a property for type '${(objectType)}'`
      log.e(mod, fun, errMsg)
      throw new Error(errMsg)
    }

    if (objectType == URL_OBJECT_METADATA)
      return await metadataController.getObjectListCount(countBy, limit, offset)

    return await db.getObjectListCount(Model, countBy, limit, offset)

  } catch (err) {
    log.w(mod, fun, err)
    throw err
  }
}

async function getObjectListGroup(objectType, groupBy, limit, offset) {
  const fun = 'getObjectListGroup'
  log.d(mod, fun, `objectType: ${objectType}`)
  try {
    checkIsUrlObject(objectType)

    /* beautify ignore:start */
    const {Model, idField} = db.getObjectAccesses(objectType)
    /* beautify ignore:end */

    if (!db.isProperty(Model, groupBy))
      throw new Error(`Field '${groupBy}' is not a property for objects of type '${(objectType)}'`)

    if (objectType == URL_OBJECT_METADATA)
      return await metadataController.getObjectListGroup(groupBy, limit, offset)

    return await db.getObjectListGroup(objectType, groupBy, limit, offset)

  } catch (err) {
    log.w(mod, fun, err)
    throw err
  }
}

async function editObject(objectType, editedObjectData) {
  const fun = 'editObject'
  log.d(mod, fun, ``)
  checkIsUrlObject(objectType)

  let dbReadyObject
  if (objectType == URL_OBJECT_METADATA) return await metadataController.updateMetadata(editedObjectData)

  /* beautify ignore:start */
  const {Model, idField} = db.getObjectAccesses(objectType)
  /* beautify ignore:end */
  return await db.updateObject(Model, idField, editedObjectData)
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
      break
    default:
      return false
  }
}

exports.setPublishedFlag = async (dbObject) => {
  if (!dbObject.publishedAt) dbObject.publishedAt = utils.nowISO()
}

//---------------------------------------------------------------
// Treatments of properties: DB -> RUDI
//---------------------------------------------------------------

async function treatDbObject(objectType, dbObject) {
  const fun = 'treatDbObject'
  // log.d(mod, fun, `objectType: ${objectType}\nobjectData: ${json.beautify(dbObject)}`)

  switch (objectType) {
    case URL_OBJECT_METADATA:
      return await metadataController.dbMetadataToRudi(dbObject)
    case URL_OBJECT_SKOS_SCHEME:
      return await skosController.dbSchemeToRudi(dbObject)
    case URL_OBJECT_SKOS_CONCEPT:
      return await skosController.dbConceptToRudiMinimal(dbObject)
    case URL_OBJECT_ORGANIZATIONS:
    case URL_OBJECT_CONTACTS:
    case URL_ACTION_REPORT:
      return dbObject
      break
    default:
      throw new Error(msg.objectTypeNotFound(objectType))
  }
}

async function treatDbObjectList(objectType, dbObjectList) {
  const fun = 'treatDbObjectList'
  log.d(mod, fun, ``)
  // log.d(mod, fun, `objectType: ${objectType}\nobjectData: ${json.beautify(rudiObjectList)}`)

  switch (objectType) {
    case URL_OBJECT_METADATA:
      const rudiMetadataList = await metadataController.dbMetadataListToRudi(dbObjectList)
      return rudiMetadataList
      break;
    case URL_OBJECT_SKOS_CONCEPT:
      const conceptList = await skosController.dbConceptListToRudiRecursive(dbObjectList)
      return conceptList
      break;
    case URL_OBJECT_SKOS_SCHEME:
    case URL_OBJECT_ORGANIZATIONS:
    case URL_OBJECT_CONTACTS:
    case URL_OBJECT_MEDIA:
    case URL_ACTION_REPORT:
      return dbObjectList
      break;
    default:
      throw new Error(msg.objectTypeNotFound(objectType))
  }
}

//---------------------------------------------------------------
// Controllers
//---------------------------------------------------------------

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

    /* beautify ignore:start */
    // identify object model
    const {Model, idField} = db.getObjectAccesses(objectType)
    // accessing the request body
    let rudiObject = req.body
    /* beautify ignore:end */

    // retrieving the id
    // log.d(mod, fun, `objectType: '${objectType}', incomingData: '${json.beautify(rudiObject)}' `)
    const rudiId = json.accessProperty(rudiObject, idField)

    // First: we make sure object doesn't exist already
    const existsObject = await db.doesObjectExistWithRudiId(Model, idField, rudiId)
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

    // identify object model
    /* beautify ignore:start */
    const {Model, idField} = db.getObjectAccesses(objectType)
    /* beautify ignore:end */

    // log.d(mod, fun, `objectType: '${objectType}', idFieldLabel: '${idFieldLabel}' `)

    // ensure the object exists
    let dbObject
    if (objectType == URL_OBJECT_METADATA) {
      dbObject = await db.getEnsuredMetadataWithRudiId(objectId)
    } else {
      dbObject = await db.getEnsuredObjectWithRudiId(objectType, Model, idField, objectId)
    }
    // log.d(mod, fun, `dbObject: ${json.beautify(dbObject)}`)

    // special treatments
    // const refinedObject = await treatDbObject(objectType, dbObject)

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

    /* beautify ignore:start */
    // identify object model
    const {Model, idField} = db.getObjectAccesses(objectType)
    /* beautify ignore:end */

    // log.d(mod, fun, `objectType: '${objectType}', dbModel: ${dbModel}, idFieldLabel: '${idFieldLabel}' `)

    // retrieve query parameters: 'limit' and 'offset'
    const limit = parseInt(req.query[QUERY_LIMIT]) || QUERY_LIMIT_DEFAULT
    const offset = parseInt(req.query[QUERY_OFFSET]) || QUERY_OFFSET_DEFAULT
    const filter = req.query[QUERY_FILTER]
    const groupBy = req.query[QUERY_GROUP_BY]
    const countBy = req.query[QUERY_COUNT_BY]

    // accessing the objects
    let objectList
    if (!countBy && !groupBy) {
      if (objectType == URL_OBJECT_METADATA) {
        objectList = await db.getMetadataList(limit, offset, filter)
      } else {
        objectList = await db.getObjectList(Model, limit, offset, filter)
      }
      // special treatments
      // objectList = await treatDbObjectList(objectType, dbObjectList)
    } else if (!!groupBy) {
      objectList = await getObjectListGroup(objectType, groupBy, limit, offset)
    } else { // if( !!countBy) {
      objectList = await getObjectListCount(objectType, countBy, limit, offset)
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

    /* beautify ignore:start */
    // identify object model
    const {Model, idField} = db.getObjectAccesses(objectType)
    /* beautify ignore:end */

    const queryParameters = url.parse(req.url, true).query
    const parsedParameters = parseQueryParameters(objectType, queryParameters)
    // log.d(mod, fun, json.beautify(`req.query: ${json.beautify(req.query)}`))

    // accessing the objects

    const limit = parsedParameters[QUERY_LIMIT]
    const offset = parsedParameters[QUERY_OFFSET]
    const filter = parsedParameters[QUERY_FILTER]

    if (objectType == URL_OBJECT_METADATA) {
      return await db.getMetadataList(limit, offset, filter)
    } else {
      return await db.getObjectList(Model, limit, offset, filter)
    }

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

    /* beautify ignore:start */
    // identify object model
    const {Model, idField} = db.getObjectAccesses(objectType)
    // retrieve incoming data
    const {...incomingPartialRudiObject} = req.body
    /* beautify ignore:end */
    // log.d(mod, fun, `incomingPartialRudiObject: ${json.beautify(incomingPartialRudiObject)}`)

    // retrieve url parameters: object type, object id
    const rudiId = json.accessProperty(req.body, idField)

    const existsObject = await db.doesObjectExistWithRudiId(Model, idField, rudiId)
    if (!existsObject) throw new Error(`${msg.objectNotFound(objectType, rudiId)}`)

    // const dbReadyObject = await db.updateObject(Model, idField, incomingPartialRudiObject)
    const dbReadyObject = await editObject(objectType, incomingPartialRudiObject)
    return dbReadyObject
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

    /* beautify ignore:start */
    // identify object model
    const {Model, idField} = db.getObjectAccesses(objectType)
    /* beautify ignore:end */

    // ensure the object exists
    const objectToDelete = await db.getEnsuredObjectWithRudiId(objectType, Model, idField, objectRudiId)

    // const deletedObject = await deleteObject(objectType, Model, idField, objectId)
    /* 
        const isOrgUsed = await db.isOrgUsedInMetadata(objectId)
        log.d(mod, fun, `isOrgUsed: ${isOrgUsed}`)
        return
     */
    if (await isObjectReferenced(objectType, objectRudiId)) {
      const err = new Error(msg.objectNotDeletedBecauseUsed(objectType, objectRudiId))
      err.statusCode = 403
      throw err
    }
    // TODO: if SkosScheme: delete all SkosConcepts that reference it
    // TODO: if SkosConcept: update all other SkosConcepts that reference it (parents/children/siblings/relatives)
    if (objectType == URL_OBJECT_METADATA) {
      return await db.deleteMetadata(objectRudiId)
    } else {
      return await db.deleteObject(Model, idField, objectRudiId)
    }
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
    const {Model, idField} = db.getObjectAccesses(objectType)
    /* beautify ignore:end */

    // retrieve incoming data
    const filter = req.body
    log.d(mod, fun, json.beautify(filter))
    let deletionResult
    if (Array.isArray(filter)) {
      deletionResult = await db.deleteManyWithRudiIds(Model, idField, filter)
    } else {
      deletionResult = await db.deleteManyWithFilter(Model, filter)
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
    // retrieve url parameters: object type, object id
    const objectType = json.accessReqParam(req, PARAM_OBJECT)

    /* beautify ignore:start */
    // identify object model
    const {Model, idField} = db.getObjectAccesses(objectType)
    /* beautify ignore:end */

    const object = await db.deleteAll(Model)
    return object
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
  log.d(mod, fun, ``)
  try {
    return uuid.v4()
  } catch (err) {
    log.e(mod, fun, err)
    throw boom.boomify(err)
  }
}