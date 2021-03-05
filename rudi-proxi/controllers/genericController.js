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
  QUERY_OFFSET
} = require('../config/confApi')

const {
  DB_ID,
  API_METADATA_ID,
  API_ORGANIZATION_ID,
  API_CONTACT_ID,
  API_PRODUCER_PROPERTY,
  API_CONTACTS_PROPERTY,
  API_METAINFO_PROPERTY
} = require('../db/dbFields')

const Metadata = require('../definitions/models/Metadata')
const Organization = require('../definitions/models/Organization')
const Contact = require('../definitions/models/Contact')

const metadataController = require('../controllers/metadataController')
const organizationController = require('../controllers/organizationController')
const contactController = require('../controllers/contactController')
const {
  stringify
} = require('uuid')

//———————————————————————————————————————————————————————————————
// Specific object type helper functions
//———————————————————————————————————————————————————————————————

function getObjectAccesses(objectType) {
  const fun = 'getObjectAccesses'
  log.d(fun, ``)

  switch (objectType) {
    case URL_OBJECT_METADATA:
      return {
        Model: Metadata, idField: API_METADATA_ID
      }
      // accesses[DB_MODEL] = Metadata
      // accesses[DB_ID_FIELD] = API_METADATA_ID
      break;
    case URL_OBJECT_ORGANIZATIONS:
      return {
        Model: Organization, idField: API_ORGANIZATION_ID
      }
      // accesses[DB_MODEL] = Organization
      // accesses[DB_ID_FIELD] = API_ORGANIZATION_ID
      break;
    case URL_OBJECT_CONTACTS:
      return {
        Model: Contact, idField: API_CONTACT_ID
      }
      // accesses[DB_MODEL] = Contact
      // accesses[DB_ID_FIELD] = API_CONTACT_ID
      break;
    default:
      throw new Error(msg.objectTypeNotFound(objectType))
  }
}

async function newObject(objectType, objectData) {
  const fun = 'newObject'
  log.d(fun, `objectType: ${objectType}`)
  log.d(fun, `incoming objectData: ${JSON.stringify(objectData)}`)
  try {
    switch (objectType) {
      case URL_OBJECT_METADATA:
        return metadataController.newMetadata(objectData)
        break
      case URL_OBJECT_ORGANIZATIONS:
        return new Organization(objectData)
        break
      case URL_OBJECT_CONTACTS:
        return new Contact(objectData)
        break
      default:
        throw new Error(msg.objectTypeNotFound(objectType))
    }
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}


async function editObject(objectType, objectData) {
  const fun = 'editObject'
  log.d(fun, `objectType: ${objectType}`)
  log.d(fun, `incoming objectData: ${JSON.stringify(objectData)}`)

  switch (objectType) {
    case URL_OBJECT_METADATA:
      // TODONOW

      // Metadata:
      // 1. get the organization dbId, and update incoming data.
      const producer = objectData[API_PRODUCER_PROPERTY]
      if (!!producer) {

      }

      // 2. get the contacts dbIds, and update incoming data.

      // Metadata.metadataInfo:
      // 1. get the organization and contacts dbIds, and update incoming data.
      // 2. special update for metadataInfo.referenceDates: keep 'createdDate' untouched and update 'updateDate'

      const dbReadyObject = await metadataController.rudiToDbFormat(objectData, false)
      log.d(fun, `db ready objectData: ${JSON.stringify(objectData)}`)
      const newMetadata = new Metadata(dbReadyObject)
      return newMetadata
      break
    case URL_OBJECT_ORGANIZATIONS:
      return new Organization(objectData)
      break
    case URL_OBJECT_CONTACTS:
      return new Contact(objectData)
      break
    default:
      throw new Error(msg.objectTypeNotFound(objectType))
  }
}


async function specialTreatments(objectType, objectData) {
  const fun = 'specialTreatments'
  log.d(fun, `objectType: ${objectType}\nobjectData: ${JSON.stringify(objectData)}`)

  switch (objectType) {
    case URL_OBJECT_METADATA:
      return await metadataController.dbToRudiFormat(objectData)
      break
    case URL_OBJECT_ORGANIZATIONS:
      return objectData
      break
    case URL_OBJECT_CONTACTS:
      return objectData
      break
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
  log.d(fun, ``)
  try {
    // retrieve url parameters: object type, object id
    const objectType = json.accessReqParam(req, PARAM_OBJECT)

    /* beautify ignore:start */
    // identify object model
    const {Model, idField} = getObjectAccesses(objectType)
    // accessing the request body
    let incomingData = {...req.body}
    /* beautify ignore:end */

    // retrieving the id
    log.d(fun, `objectType: '${objectType}', incomingData: '${incomingData}' `)
    const id = json.accessProperty(incomingData, idField)

    // First: we make sure object doesn't exist already
    const existsObject = await db.getObjectWithRudiId(Model, idField, id)
    if (!!existsObject) throw new Error(`${msg.objectAlreadyExists(objectType, id)}`)

    // Creating new object + specific treatments
    const object = await newObject(objectType, incomingData)

    const dbActionResult = await object.save()
    log.d(fun, `${msg.objectAdded(id)}`)
    return dbActionResult
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

// Get single object by ID
// => GET /{object}/{id}
exports.getSingleObject = async (req, reply) => {
  const fun = 'getSingleObject'
  log.d(fun, ``)
  try {

    // retrieve url parameters: object type, object id
    const objectType = json.accessReqParam(req, PARAM_OBJECT)
    const objectId = json.accessReqParam(req, PARAM_ID)

    // identify object model
    /* beautify ignore:start */
    const {Model, idField} = getObjectAccesses(objectType)
    /* beautify ignore:end */

    // log.d(fun, `objectType: '${objectType}', idFieldLabel: '${idFieldLabel}' `)

    // ensure the object exists
    const dbObject = await db.getEnsuredObjectWithRudiId(objectType, Model, idField, objectId)

    // special treatments
    const treatedObject = specialTreatments(objectType, dbObject)

    // return the object
    return treatedObject
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

// Get several object
// => GET /{object}
exports.getObjectList = async (req, reply) => {
  const fun = 'getObjectList'
  log.d(fun, ``)
  try {
    // retrieve url parameters: object type, object id
    const objectType = json.accessReqParam(req, PARAM_OBJECT)

    // identify object model
    /* beautify ignore:start */
    const {Model, idField} = getObjectAccesses(objectType)
    /* beautify ignore:end */

    // log.d(fun, `objectType: '${objectType}', dbModel: ${dbModel}, idFieldLabel: '${idFieldLabel}' `)

    // retrieve query parameters: 'limit' and 'offset'
    const limit = parseInt(req.query[QUERY_LIMIT]) || 0
    const offset = parseInt(req.query[QUERY_OFFSET]) || 0

    // accessing the objects
    const objectList = await db.getObjectList(Model, limit, offset)
    return objectList
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

// Update an existing object
// => PUT /{object}
exports.updateSingleObject = async (req, reply) => {
  const fun = 'updateSingleObject'
  log.d(fun, ``)
  try {
    // retrieve url parameters: object type, object id
    const objectType = json.accessReqParam(req, PARAM_OBJECT)

    /* beautify ignore:start */
    // identify object model
    const {Model, idField} = getObjectAccesses(objectType)
    // retrieve incoming data
    const {...incomingData} = req.body
    /* beautify ignore:end */

    // retrieve url parameters: object type, object id
    const rudiId = json.accessProperty(req.body, idField)

    // ensure the object exists
    await db.getEnsuredObjectWithRudiId(objectType, Model, idField, rudiId)

    return await editObject(objectType, incomingData)

  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}


// Delete a single object
// => DELETE /{object}/{id}
exports.deleteSingleObject = async (req, reply) => {
  const fun = 'deleteSingleObject'
  log.d(fun, ``)
  try {
    // retrieve url parameters: object type, object id
    const objectType = json.accessReqParam(req, PARAM_OBJECT)
    const objectId = json.accessReqParam(req, PARAM_ID)

    /* beautify ignore:start */
    // identify object model
    const {Model, idField} = getObjectAccesses(objectType)
    /* beautify ignore:end */

    // ensure the object exists
    await db.getEnsuredObjectWithRudiId(objectType, Model, idField, objectId)

    const deletedObject = db.deleteObject(Model, idField, objectId)

    return deletedObject
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}


// Delete several objects
// => POST /{object}/deletion
exports.deleteObjectList = async (req, reply) => {
  const fun = 'deleteObjectList'
  log.d(fun, ``)
  try {
    // retrieve url parameters: object type, object id
    const objectType = json.accessReqParam(req, PARAM_OBJECT)

    /* beautify ignore:start */
    // identify object model
    const {Model, idField} = getObjectAccesses(objectType)
    // retrieve incoming data
    const {...conditions} = req.body
    /* beautify ignore:end */
    log.d(fun, JSON.stringify(conditions))

    const object = await db.deleteMany(Model, conditions)
    return object
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}


// Delete every object
// => DELETE /{object}
exports.deleteEveryObject = async (req, reply) => {
  const fun = 'deleteEveryObject'
  log.d(fun, ``)
  try {
    // retrieve url parameters: object type, object id
    const objectType = json.accessReqParam(req, PARAM_OBJECT)

    /* beautify ignore:start */
    // identify object model
    const {Model, idField} = getObjectAccesses(objectType)
    /* beautify ignore:end */

    const object = await db.deleteAll(Model)
    return object
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}