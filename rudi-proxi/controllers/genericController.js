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
  URL_OBJECT,
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

const Metadata = require('../definitions/models/Metadata');
const Organization = require('../definitions/models/Organization');
const Contact = require('../definitions/models/Contact');
const Report = require('../definitions/models/Report');
const SkosConcept = require('../definitions/models/SkosConcept');
const SkosScheme = require('../definitions/models/SkosScheme');
/* beautify ignore:start */
const { Media, MediaFile, MediaSeries } = require('../definitions/models/Media');
/* beautify ignore:end */

//---------------------------------------------------------------
// Specific controlelrs
//---------------------------------------------------------------
const metadataController = require('../controllers/metadataController')
const organizationController = require('../controllers/organizationController')
const contactController = require('../controllers/contactController');
const skosController = require('./skosController');

//---------------------------------------------------------------
// Specific object type helper functions
//---------------------------------------------------------------

async function newObject(objectType, objectData) {
  const fun = 'newObject'
  log.d(mod, fun, `objectType: ${objectType}`)
  log.d(mod, fun, `incoming objectData: ${json.beautify(objectData)}`)
  try {
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
    log.e(mod, fun, err)
    throw boom.boomify(err)
  }
}

async function editObject(objectType, editedObjectData) {
  const fun = 'editObject'
  log.d(mod, fun, `objectType: ${objectType}`)
  log.d(mod, fun, `incoming objectData: ${json.beautify(editedObjectData)}`)
  let dbReadyObject
  switch (objectType) {
    case URL_OBJECT_METADATA:
      dbReadyObject = await metadataController.updateMetadata(editedObjectData)
      break
    case URL_OBJECT_ORGANIZATIONS:
    case URL_OBJECT_CONTACTS:
    case URL_OBJECT_SKOS_CONCEPT:
    case URL_OBJECT_SKOS_SCHEME:
      /* beautify ignore:start */
      const {Model, idField} = db.getObjectAccesses(objectType)
      /* beautify ignore:end */
      dbReadyObject = await db.updateObject(Model, idField, editedObjectData)
      break
    default:
      throw new Error(msg.objectTypeNotFound(objectType))
  }
  return dbReadyObject
}

async function isDeletionPermitted(objectType, Model, objectToDelete) {
  const fun = 'isDeletionPermitted'
  log.d(mod, fun, `objectType: ${objectType}`)

  switch (objectType) {
    case URL_OBJECT_METADATA:
    case URL_OBJECT_SKOS_CONCEPT:
    case URL_ACTION_REPORT:
    case URL_OBJECT_SKOS_SCHEME:
      return true
      break
    case URL_OBJECT_ORGANIZATIONS:
      return !(await db.isOrgUsedInMetadata(objectToDelete))
      break
    case URL_OBJECT_CONTACTS:
      return !(await db.isContactUsedInMetadata(objectToDelete))
      break
    default:
      throw new Error(msg.objectTypeNotFound(objectType))
  }
  return actionResult
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

async function getObjectListCount(objectType, Model, groupBy) {
  switch (objectType) {
    case URL_OBJECT_METADATA:
      const rudiMetadataList = await metadataController.getObjectListCount(groupBy)
      return rudiMetadataList
      break;
    case URL_OBJECT_SKOS_CONCEPT:
    case URL_OBJECT_SKOS_SCHEME:
    case URL_OBJECT_ORGANIZATIONS:
    case URL_OBJECT_CONTACTS:
    case URL_OBJECT_MEDIA:
    case URL_ACTION_REPORT:
      return db.getObjectListCount(Model, groupBy)
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
  log.v(mod, fun, `< POST ${URL_OBJECT}`)
  try {
    // retrieve url parameters: object type, object id
    const objectType = json.accessReqParam(req, PARAM_OBJECT)

    /* beautify ignore:start */
    // identify object model
    const {Model, idField} = db.getObjectAccesses(objectType)
    // accessing the request body
    let rudiObject = {...req.body}
    /* beautify ignore:end */

    // retrieving the id
    log.d(mod, fun, `objectType: '${objectType}', incomingData: '${json.beautify(rudiObject)}' `)
    const rudiId = json.accessProperty(rudiObject, idField)

    // First: we make sure object doesn't exist already
    const existsObject = await db.doesObjectExistWithRudiId(Model, idField, rudiId)
    if (existsObject) throw new Error(`${msg.objectAlreadyExists(objectType, rudiId)}`)

    // Creating new object + specific treatments
    const createdObject = await newObject(objectType, rudiObject)
    // const dbReadyObject = await new Model(rudiObject)
    // log.d(mod, fun, `created dbReadyObject: ${json.beautify(dbReadyObject)}`)

    // const dbActionResult = await dbReadyObject.save()
    // log.d(mod, fun, `saved, dbActionResult: ${json.beautify(dbActionResult)}`)

    log.i(mod, fun, `${msg.objectAdded(objectType, rudiId)}`)
    // const refinedObject = await treatDbObject(objectType, dbReadyObject)
    // return refinedObject
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
  log.v(mod, fun, `< GET ${URL_OBJECT}/:${PARAM_ID}`)
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
    const dbObject = await db.getEnsuredObjectWithRudiId(objectType, Model, idField, objectId)
    log.d(mod, fun, `dbObject: ${json.beautify(dbObject)}`)

    // special treatments
    const refinedObject = await treatDbObject(objectType, dbObject)

    // return the object
    return refinedObject
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
  log.v(mod, fun, `< GET ${URL_OBJECT}`)
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

    // accessing the objects
    let objectList
    if (!groupBy) {
      const dbObjectList = await db.getObjectList(Model, limit, offset)
      // special treatments
      objectList = await treatDbObjectList(objectType, dbObjectList)
    } else {
      objectList = await getObjectListCount(objectType, Model, groupBy)
    }
    log.d(mod, fun, `objectList: ${json.beautify(objectList)}`)

    return objectList
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
  log.v(mod, fun, `< PUT ${URL_OBJECT}`)
  try {
    // retrieve url parameters: object type, object id
    const objectType = json.accessReqParam(req, PARAM_OBJECT)

    /* beautify ignore:start */
    // identify object model
    const {Model, idField} = db.getObjectAccesses(objectType)
    // retrieve incoming data
    const {...incomingPartialRudiObject} = req.body
    /* beautify ignore:end */
    log.d(mod, fun, `incomingPartialRudiObject: ${json.beautify(incomingPartialRudiObject)}`)

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
  log.v(mod, fun, `< DELETE ${URL_OBJECT}/:${PARAM_ID}`)
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
    const deletionOK = await isDeletionPermitted(objectType, Model, objectToDelete)
    if (!deletionOK) throw new Error(msg.objectNotDeletedBecauseUsed(objectType, objectRudiId))

    // TODO: if SkosScheme: delete all SkosConcepts that reference it
    // TODO: if SkosConcept: update all other SkosConcepts that reference it (parents/children/siblings/relatives)
    const deletedObject = await db.deleteObject(Model, idField, objectRudiId)
    // return: dbToRudi?
    let returnedObject = deletedObject
    if (objectType == URL_OBJECT_METADATA) {
      try {
        returnedObject = metadataController.dbMetadataToRudi(deletedObject)
      } catch (err) {
        log.w(err)
      }

    }

    return returnedObject
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
  log.v(mod, fun, `< POST ${URL_OBJECT}/${URL_ACTION_DELETION}`)
  try {
    // retrieve url parameters: object type, object id
    const objectType = json.accessReqParam(req, PARAM_OBJECT)

    /* beautify ignore:start */
    // identify object model
    const {Model, idField} = db.getObjectAccesses(objectType)
    /* beautify ignore:end */

    // retrieve incoming data
    const rudiIdList = req.body
    log.d(mod, fun, json.beautify(rudiIdList))

    const deletionResult = await db.deleteManyWithRudiIds(Model, idField, rudiIdList)
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
  log.v(mod, fun, `< DELETE ${URL_OBJECT}`)
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