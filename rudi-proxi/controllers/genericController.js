'use strict';
const mod = 'genCtrl'
/*
 * In this file are made the different steps followed for each 
 * action on the objects (producer or publisher)
 */

//———————————————————————————————————————————————————————————————
// External dependancies 
//———————————————————————————————————————————————————————————————
const boom = require('@hapi/boom')

//———————————————————————————————————————————————————————————————
// Internal dependancies 
//———————————————————————————————————————————————————————————————
const log = require('../utils/logging')
const msg = require('../utils/msg')

const db = require('../db/dbQueries')
const dbRwk = require('../db/dbReworkData')
const json = require('../utils/jsonAccess')

//———————————————————————————————————————————————————————————————
// Constants
//———————————————————————————————————————————————————————————————

const {
  URL_OBJECT_METADATA,
  URL_OBJECT_ORGANIZATIONS,
  URL_OBJECT_CONTACTS,

  PARAM_ID,
  PARAM_OBJECT,
  QUERY_LIMIT,
  QUERY_OFFSET,
  URL_ACTION_REPORT
} = require('../config/confApi')

const {
  DB_ID,
  API_METADATA_ID,
  API_ORGANIZATION_ID,
  API_CONTACT_ID,
  API_DATA_PRODUCER_PROPERTY,
  API_DATA_CONTACTS_PROPERTY,
  API_METAINFO_PROPERTY,
  API_REPORT_ID
} = require('../db/dbFields')

const Metadata = require('../definitions/models/Metadata')
const Organization = require('../definitions/models/Organization')
const Contact = require('../definitions/models/Contact')

const metadataController = require('../controllers/metadataController')
const organizationController = require('../controllers/organizationController')
const contactController = require('../controllers/contactController')
const {
  stringify
} = require('uuid');
const Report = require('../definitions/models/Report');

//———————————————————————————————————————————————————————————————
// Specific object type helper functions
//——————————————————————————————————————————————————————————————— 

exports.getObjectAccesses = (objectType) => {
  const fun = 'getObjectAccesses'
  // log.d(mod, fun, ``)

  switch (objectType) {
    case URL_OBJECT_METADATA:
      return {
        Model: Metadata, idField: API_METADATA_ID
      }
      break;
    case URL_OBJECT_ORGANIZATIONS:
      return {
        Model: Organization, idField: API_ORGANIZATION_ID
      }
      break;
    case URL_OBJECT_CONTACTS:
      return {
        Model: Contact, idField: API_CONTACT_ID
      }
      break;
    case URL_ACTION_REPORT:
      return {
        Model: Report, idField: API_REPORT_ID
      }
      break;
    default:
      throw new Error(msg.objectTypeNotFound(objectType))
  }
}

async function newObject(objectType, objectData) {
  const fun = 'newObject'
  log.d(mod, fun, `objectType: ${objectType}`)
  log.d(mod, fun, `incoming objectData: ${json.beautify(objectData)}`)
  try {
    switch (objectType) {
      case URL_OBJECT_METADATA:
        return metadataController.newMetadata(objectData)
        break
      case URL_OBJECT_ORGANIZATIONS:
        try {
          log.d(mod, fun, `! new Organization(objectData)`)
          return new Organization(objectData)
        } catch (err) {
          log.e(mod, fun, `! ${err}`)
        }
        break
      case URL_OBJECT_CONTACTS:
        return new Contact(objectData)
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
      const {
        Model, idField
      } = this.getObjectAccesses(objectType)
      dbReadyObject = await db.updateObject(Model, idField, editedObjectData)
      break
    default:
      throw new Error(msg.objectTypeNotFound(objectType))
  }
  return dbReadyObject
}


//———————————————————————————————————————————————————————————————
// Treatments of properties: DB -> RUDI
//———————————————————————————————————————————————————————————————

async function treatDbObject(objectType, dbObject) {
  const fun = 'treatDbObject'
  // log.d(mod, fun, `objectType: ${objectType}\nobjectData: ${json.beautify(dbObject)}`)

  switch (objectType) {
    case URL_OBJECT_METADATA:
      return await metadataController.dbToRudiFormat(dbObject)
      break
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
      const rudiMetadataList = await metadataController.dbToRudiFormatList(dbObjectList)
      return rudiMetadataList
      break;
    case URL_OBJECT_ORGANIZATIONS:
    case URL_OBJECT_CONTACTS:
    case URL_ACTION_REPORT:
      return dbObjectList
      break;
    default:
      throw new Error(msg.objectTypeNotFound(objectType))
  }
}


//———————————————————————————————————————————————————————————————
// Controllers
//———————————————————————————————————————————————————————————————

// Add a new object
// => POST /{object}/{id}
exports.addSingleObject = async (req, reply) => {
  const fun = 'addSingleObject'
  log.d(mod, fun, ``)
  try {
    // retrieve url parameters: object type, object id
    const objectType = json.accessReqParam(req, PARAM_OBJECT)

    /* beautify ignore:start */
    // identify object model
    const {Model, idField} = this.getObjectAccesses(objectType)
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
    const dbReadyObject = await newObject(objectType, rudiObject)
    // const dbReadyObject = await new Model(rudiObject)
    log.d(mod, fun, `created dbReadyObject: ${json.beautify(dbReadyObject)}`)

    const dbActionResult = await dbReadyObject.save()
    // log.d(mod, fun, `saved, dbActionResult: ${json.beautify(dbActionResult)}`)

    log.i(mod, fun, `${msg.objectAdded(objectType, rudiId)}`)
    const refinedObject = await treatDbObject(objectType, dbReadyObject)
    return refinedObject
  } catch (err) {
    log.e(mod, fun, err)
    throw boom.boomify(err)
  }
}

// Get single object by ID
// => GET /{object}/{id}
exports.getSingleObject = async (req, reply) => {
  const fun = 'getSingleObject'
  log.d(mod, fun, ``)
  try {

    // retrieve url parameters: object type, object id
    const objectType = json.accessReqParam(req, PARAM_OBJECT)
    const objectId = json.accessReqParam(req, PARAM_ID)

    // identify object model
    /* beautify ignore:start */
    const {Model, idField} = this.getObjectAccesses(objectType)
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

// Get several object
// => GET /{object}
exports.getObjectList = async (req, reply) => {
  const fun = 'getObjectList'
  log.d(mod, fun, ``)
  try {
    // retrieve url parameters: object type, object id
    const objectType = json.accessReqParam(req, PARAM_OBJECT)

    // identify object model
    /* beautify ignore:start */
    const {Model, idField} = this.getObjectAccesses(objectType)
    /* beautify ignore:end */

    // log.d(mod, fun, `objectType: '${objectType}', dbModel: ${dbModel}, idFieldLabel: '${idFieldLabel}' `)

    // retrieve query parameters: 'limit' and 'offset'
    const limit = parseInt(req.query[QUERY_LIMIT]) || 0
    const offset = parseInt(req.query[QUERY_OFFSET]) || 0

    // accessing the objects
    const objectList = await db.getObjectList(Model, limit, offset)

    // special treatments
    const refinedObjectList = await treatDbObjectList(objectType, objectList)

    return refinedObjectList
  } catch (err) {
    log.e(mod, fun, err)
    throw boom.boomify(err)
  }
}

// Update an existing object
// => PUT /{object}
exports.updateSingleObject = async (req, reply) => {
  const fun = 'updateSingleObject'
  log.d(mod, fun, ``)
  try {
    // retrieve url parameters: object type, object id
    const objectType = json.accessReqParam(req, PARAM_OBJECT)

    /* beautify ignore:start */
    // identify object model
    const {Model, idField} = this.getObjectAccesses(objectType)
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

// Delete a single object
// => DELETE /{object}/{id}
exports.deleteSingleObject = async (req, reply) => {
  const fun = 'deleteSingleObject'
  log.d(mod, fun, ``)
  try {
    // retrieve url parameters: object type, object id
    const objectType = json.accessReqParam(req, PARAM_OBJECT)
    const objectId = json.accessReqParam(req, PARAM_ID)

    /* beautify ignore:start */
    // identify object model
    const {Model, idField} = this.getObjectAccesses(objectType)
    /* beautify ignore:end */

    // ensure the object exists
    await db.getEnsuredObjectWithRudiId(objectType, Model, idField, objectId)

    const deletedObject = db.deleteObject(Model, idField, objectId)

    return deletedObject
  } catch (err) {
    log.e(mod, fun, err)
    throw boom.boomify(err)
  }
}


// Delete several objects
// => POST /{object}/deletion
exports.deleteObjectList = async (req, reply) => {
  const fun = 'deleteObjectList'
  log.d(mod, fun, ``)
  try {
    // retrieve url parameters: object type, object id
    const objectType = json.accessReqParam(req, PARAM_OBJECT)

    /* beautify ignore:start */
    // identify object model
    const {Model, idField} = this.getObjectAccesses(objectType)
    // retrieve incoming data
    const {...conditions} = req.body
    /* beautify ignore:end */
    log.d(mod, fun, json.beautify(conditions))

    const object = await db.deleteMany(Model, conditions)
    return object
  } catch (err) {
    log.e(mod, fun, err)
    throw boom.boomify(err)
  }
}


// Delete every object
// => DELETE /{object}
exports.deleteEveryObject = async (req, reply) => {
  const fun = 'deleteEveryObject'
  log.d(mod, fun, ``)
  try {
    // retrieve url parameters: object type, object id
    const objectType = json.accessReqParam(req, PARAM_OBJECT)

    /* beautify ignore:start */
    // identify object model
    const {Model, idField} = this.getObjectAccesses(objectType)
    /* beautify ignore:end */

    const object = await db.deleteAll(Model)
    return object
  } catch (err) {
    log.e(mod, fun, err)
    throw boom.boomify(err)
  }
}