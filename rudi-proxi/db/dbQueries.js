'use strict'

const mod = 'db'
/*
 * In this file are made the different calls to the database
 */

// ---------------------------------------------------------------
// External dependancies
// ---------------------------------------------------------------
const boom = require('@hapi/boom')
const mongoose = require('mongoose')

// ---------------------------------------------------------------
// Internal dependencies
// ---------------------------------------------------------------
const log = require('../utils/logging')
const msg = require('../utils/msg')

const json = require('../utils/jsonAccess')
const utils = require('../utils/jsUtils')

// ---------------------------------------------------------------
// Constants
// ---------------------------------------------------------------
const {
  PARAM_ID,
  URL_OBJECT_METADATA,
  URL_OBJECT_ORGANIZATIONS,
  URL_OBJECT_CONTACTS,
  URL_OBJECT_MEDIA,
  URL_OBJECT_SKOS_SCHEME,
  URL_OBJECT_SKOS_CONCEPT,
  URL_ACTION_REPORT,
  URL_LICENCE_SUFFIX,
  QUERY_LIMIT_DEFAULT,
  QUERY_OFFSET_DEFAULT,
} = require('../config/confApi')

const {
  DB_URL
} = require('../config/confSystem')

// Fields from the JSON as definied in the API
const {
  DB_ID,
  API_METADATA_ID,
  API_ORGANIZATION_ID,
  API_CONTACT_ID,
  API_MEDIA_ID,
  API_REPORT_ID,
  API_DATA_PRODUCER_PROPERTY,
  API_DATA_CONTACTS_PROPERTY,
  API_METAINFO_PROPERTY,
  API_METAINFO_PROVIDER_PROPERTY,
  API_METAINFO_CONTACTS_PROPERTY,
  API_MEDIA_TYPE_PROPERTY,
  API_SKOS_SCHEME_ID,
  API_SKOS_CONCEPT_ID,
  API_SKOS_SCHEME_CODE,
  API_SKOS_CONCEPT_ROLE,
  FIELDS_TO_SKIP,
  API_MEDIA_PROPERTY,
} = require('./dbFields')

// ---------------------------------------------------------------
// Data models
// ---------------------------------------------------------------
const Organization = require('../definitions/models/Organization')
const Contact = require('../definitions/models/Contact')
/* beautify ignore:start */
const { Metadata, METADATA_FIELDS_TO_POPULATE } = require('../definitions/models/Metadata')
const { Media } = require('../definitions/models/Media')
const { Report } = require('../definitions/models/Report')
/* beautify ignore:end */

const SkosScheme = require('../definitions/models/SkosScheme')
const SkosConcept = require('../definitions/models/SkosConcept')

// ---------------------------------------------------------------
// Properties with special treatments
// ---------------------------------------------------------------
/** Fields to skip while populating */
const SKIP_FIELDS = `-${FIELDS_TO_SKIP.join(' -')}`

// ---------------------------------------------------------------
// Specific object accesses
// ---------------------------------------------------------------
const OBJ_MODEL = {
  [URL_OBJECT_METADATA]: Metadata,
  [URL_OBJECT_ORGANIZATIONS]: Organization,
  [URL_OBJECT_CONTACTS]: Contact,
  [URL_OBJECT_MEDIA]: Media,
  [URL_OBJECT_SKOS_SCHEME]: SkosScheme,
  [URL_OBJECT_SKOS_CONCEPT]: SkosConcept,
  [URL_LICENCE_SUFFIX]: SkosConcept,
  [URL_ACTION_REPORT]: Report,
}

const ID_PROP = {
  [URL_OBJECT_METADATA]: API_METADATA_ID,
  [URL_OBJECT_ORGANIZATIONS]: API_ORGANIZATION_ID,
  [URL_OBJECT_CONTACTS]: API_CONTACT_ID,
  [URL_OBJECT_MEDIA]: API_MEDIA_ID,
  [URL_OBJECT_SKOS_SCHEME]: API_SKOS_SCHEME_ID,
  [URL_OBJECT_SKOS_CONCEPT]: API_SKOS_CONCEPT_ID,
  [URL_LICENCE_SUFFIX]: API_SKOS_CONCEPT_ID,
  [URL_ACTION_REPORT]: API_REPORT_ID,
}

function assertIsString(fun, param) {
  if (typeof param !== 'string') {
    const errMsg = msg.parameterTypeExpected(fun, 'string', param)
    log.w(mod, fun, errMsg)
    throw new Error(errMsg)
  }
}

exports.getObjectModel = (objectType) => {
  const fun = 'getObjectModel'
  // log.d(mod, fun, ``)
  assertIsString(fun, objectType)
  const Model = OBJ_MODEL[objectType]
  if (!Model) throw new Error(msg.objectTypeNotFound(objectType))
  return Model
}

exports.getObjectIdField = (objectType) => {
  const fun = 'getObjectIdField'
  // log.d(mod, fun, ``)
  assertIsString(fun, objectType)
  const idField = ID_PROP[objectType]
  if (!idField) throw new Error(msg.objectTypeNotFound(objectType))
  return idField
}

exports.getObjectAccesses = (objectType) => {
  const fun = 'getObjectAccesses'
  // log.d(mod, fun, ``)
  return {
    Model: this.getObjectModel(objectType),
    idField: this.getObjectIdField(objectType)
  }
}

exports.getFieldModel = (objectType, field) => {
  const fun = 'fieldModel'
  log.d(mod, fun, `field: ${field}`)

  assertIsString(fun, objectType)
  if (objectType != URL_OBJECT_METADATA) return

  switch (field) {
    case API_DATA_PRODUCER_PROPERTY:
    case `${API_METAINFO_PROPERTY}.${API_METAINFO_PROVIDER_PROPERTY}`:
      return Organization
      break
    case API_DATA_CONTACTS_PROPERTY:
    case `${API_METAINFO_PROPERTY}.${API_METAINFO_CONTACTS_PROPERTY}`:
      return Contact
      break
    case `${API_MEDIA_PROPERTY}`:
      return Media
      break
    default:
      return null
  }
}

function getPopulateOptions(objectType) {
  if (objectType == URL_OBJECT_METADATA) return {
    path: METADATA_FIELDS_TO_POPULATE,
    select: SKIP_FIELDS
  }
  else return {
    select: SKIP_FIELDS
  }
}

function getPopulateFields(objectType) {
  if (objectType != URL_OBJECT_METADATA) return []
  return METADATA_FIELDS_TO_POPULATE
}

// ---------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------
exports.getModelPropertyNames = (Model) => {
  return Object.keys(Model.schema.paths)
}

exports.isProperty = (Model, prop) => {
  return this.getModelPropertyNames(Model).includes(prop)
}

// ---------------------------------------------------------------
// Actions on DB tables
// ---------------------------------------------------------------
exports.getCollections = async () => {
  const fun = `getCollections`
  try {
    const collections = await mongoose.connection.db.listCollections().toArray()

    collections.map((collection) => {
      log.v(mod, fun, `${json.beautify(collection.name)}`)
    })
    return collections
  } catch (err) {
    log.w(mod, fun, err)
    throw err
  }
}

exports.dropDB = async () => {
  const fun = `cleanDb`
  try {
    /* Drop the whole DB !!! */
    const dbActionResult = await mongoose.connection.db.dropDatabase()
    log.d(mod, fun, 'DB dropped')
    return dbActionResult
  } catch (err) {
    log.w(mod, fun, err)
    throw err
  }
}
// ---------------------------------------------------------------
// Generic functions: get single object
// ---------------------------------------------------------------
exports.getObject = async (objectType, filter) => {
  const fun = `getObject`
  log.d(mod, fun, ``)
  try {
    const Model = this.getObjectModel(objectType)
    const populateFields = getPopulateFields(objectType)
    if (utils.isEmptyArray(populateFields))
      return await Model.findOne(filter)
    else
      return await Model.findOne(filter).populate(populateFields)
  } catch (err) {
    log.w(mod, fun, err)
    throw err
  }
}

exports.getObjectWithDbId = async (objectType, dbId) => {
  const fun = `getObjectWithDbId`
  log.d(mod, fun, ``)
  /* beautify ignore:start */
    const filter = {[DB_ID]: dbId}
    /* beautify ignore:end */
  return await this.getObject(objectType, filter)
}

exports.getObjectWithRudiId = async (objectType, rudiId) => {
  const fun = `getObjectWithRudiId`
  log.d(mod, fun, ``)
  if (!rudiId) throw new Error(`${msg.parameterExpected(fun, PARAM_ID)}`)
  /* beautify ignore:start */
    const idField = this.getObjectIdField(objectType)
    const filter = {[idField]: rudiId}
    /* beautify ignore:end */
  return await this.getObject(objectType, filter)
}

exports.getEnsuredObjectWithRudiId = async (objectType, rudiId) => {
  const fun = `getEnsuredObjectWithRudiId`
  log.d(mod, fun, ``)
  if (!rudiId) throw new Error(`${msg.parameterExpected(fun, PARAM_ID)}`)
  const dbObject = await this.getObjectWithRudiId(objectType, rudiId)
  if (!dbObject) throw new Error(`${msg.objectNotFound(objectType, rudiId)}`)
  return dbObject
}

exports.getObjectWithJson = async (objectType, rudiObject) => {
  const fun = `getObjectWithJson`
  log.d(mod, fun, ``)
  const idField = this.getObjectIdField(objectType)
  const rudiId = json.accessProperty(rudiObject, idField)
  return await this.getObjectWithRudiId(objectType, rudiId)
}

exports.getEnsuredObjectWithJson = async (objectType, rudiObject) => {
  const fun = `getEnsuredObjectWithJson`
  log.d(mod, fun, ``)
  try {
    const idField = this.getObjectIdField(objectType)
    const rudiId = json.accessProperty(rudiObject, idField)
    const dbObject = await this.getObjectWithRudiId(objectType, rudiId)
    if (!dbObject) throw new Error(`${msg.objectNotFound(objectType, rudiId)}`)
    return dbObject
  } catch (err) {
    log.w(mod, fun, err)
    throw err
  }
}

exports.getEnsuredObjectWithDbId = async (objectType, dbId) => {
  const fun = `getEnsuredObjectWithDbId`
  log.d(mod, fun, ``)
  try {
    const dbObject = await this.getObjectWithDbId(objectType, dbId)
    if (!dbObject) throw new Error(`${msg.objectNotFound(objectType, dbId)}`)
    return dbObject
  } catch (err) {
    log.w(mod, fun, err)
    throw err
  }
}

exports.doesObjectExistWithRudiId = async (objectType, rudiId) => {
  const fun = `doesObjectExistWithRudiId`
  log.d(mod, fun, ``)
  try {
    const dbObject = await this.getObjectWithRudiId(objectType, rudiId)
    return (!!dbObject)
  } catch (err) {
    log.w(mod, fun, err)
    throw err
  }
}

exports.doesObjectExistWithJson = async (objectType, rudiObject) => {
  const fun = `doesObjectExistWithJson`
  log.d(mod, fun, ``)
  try {
    const dbObject = await this.getObjectWithJson(objectType, rudiObject)
    return (!!dbObject)
  } catch (err) {
    log.w(mod, fun, err)
    throw err
  }
}

// ---------------------------------------------------------------
// Generic functions: get single object / partial access
// ---------------------------------------------------------------
exports.getObjectPropertiesWithDbId = async (objectType, dbId, propertyList) => {
  const fun = `getObjectPropertiesWithDbId`
  log.d(mod, fun, ``)
  try {
    const Model = this.getObjectModel(objectType)
    const populateFields = getPopulateFields(objectType)
    const fields = propertyList.join(' ')
    /* beautify ignore:start */
    const filter = {[DB_ID]: dbId}
    /* beautify ignore:end */
    if (utils.isEmptyArray(populateFields))
      return await Model.findOne(filter, fields)
    else
      return await Model.findOne(filter, fields).populate(populateFields)
  } catch (err) {
    log.w(mod, fun, err)
    throw err
  }
}

exports.getObjectPropertiesWithRudiId = async (objectType, rudiId, propertyList) => {
  const fun = `getObjectPropertiesWithRudiId`
  log.d(mod, fun, `${objectType}: ${rudiId}`)
  try {
    if (!rudiId) throw new Error(`${msg.parameterExpected(fun, idField)}`)
    /* beautify ignore:start */
    const {Model, idField} = this.getObjectAccesses(objectType)
    const filter = {[idField]: rudiId}
    /* beautify ignore:end */
    const fields = propertyList.join(' ')
    const populateFields = getPopulateFields(objectType)
    if (!populateFields)
      return await Model.findOne(filter, fields)
    else
      return await Model.findOne(filter, fields).populate(populateFields)
  } catch (err) {
    log.w(mod, fun, err)
    throw err
  }
}

exports.getDbIdWithRudiId = async (objectType, rudiId) => {
  const fun = `getDbIdWithRudiId`
  log.d(mod, fun, ``)
  // log.d(mod, fun, `objectType: ${objectType}`)
  // log.d(mod, fun, `idField: ${idField}`)
  // log.d(mod, fun, `rudiId: ${rudiId}`)
  try {
    return await this.getObjectPropertiesWithRudiId(objectType, rudiId, [DB_ID])
  } catch (err) {
    log.w(mod, fun, err)
    throw err
  }
}

exports.getEnsuredDbIdWithRudiId = async (objectType, rudiId) => {
  const fun = `getEnsuredDbIdWithRudiId`
  log.d(mod, fun, ``)
  try {
    const dbId = await this.getDbIdWithRudiId(objectType, rudiId)
    if (!dbId) throw new Error(`${msg.objectNotFound(objectType, rudiId)}`)
    return dbId
  } catch (err) {
    log.w(mod, fun, err)
    throw err
  }
}

exports.getDbIdWithJson = async (objectType, rudiObject) => {
  const fun = `getDbIdWithJson`
  log.d(mod, fun, ``)
  try {
    const idField = this.getObjectIdField(objectType)
    const rudiId = json.accessProperty(rudiObject, idField)
    return await this.getDbIdWithRudiId(objectType, rudiId)
  } catch (err) {
    log.w(mod, fun, err)
    throw err
  }
}

exports.getEnsuredDbIdWithJson = async (objectType, rudiObject) => {
  const fun = `getEnsuredDbIdWithJson`
  log.d(mod, fun, ``)
  // log.d(mod, fun, `objectType: ${objectType}`)
  // log.d(mod, fun, `idField: ${idField}`)
  // log.d(mod, fun, `jsonObject: ${json.beautify(jsonObject)}`)
  try {
    const idField = this.getObjectIdField(objectType)
    const rudiId = json.accessProperty(rudiObject, idField)
    return await this.getEnsuredDbIdWithRudiId(objectType, rudiId)
  } catch (err) {
    log.w(mod, fun, err)
    throw err
  }
}

/*
exports.getObjectWithField = async (Model, fieldName, fieldValue, populateFields) => {
  const fun = `getObjectWithField`
  // log.d(mod, fun, ``)
  try {
    if (!fieldName) throw new Error(`${msg.parameterExpected(fun, 'field name')}`)

    const filter = {
      [fieldName]: fieldValue
    }
    return await this.getObject(Model, filter, populateFields)
  } catch (err) {
    log.w(mod, fun, err)
    throw err
  }
}
 */

// ---------------------------------------------------------------
// Generic functions: get object list
// ---------------------------------------------------------------
exports.getObjectList = async (objectType, limit, offset, filter, extRefs) => {
  const fun = `getObjectList`
  log.d(mod, fun, ``)
  try {
    const Model = this.getObjectModel(objectType)
    limit = limit || QUERY_LIMIT_DEFAULT
    offset = offset || QUERY_OFFSET_DEFAULT
    filter = filter || {}
    const populateFields = getPopulateFields(objectType)

    log.d(mod, fun, `limit: ${limit}, offset: ${offset}, filter: ${json.beautify(filter)}`)
    if (utils.isEmptyArray(extRefs)) {
      if (utils.isEmptyArray(populateFields))
        return await Model.find(filter).limit(limit).skip(offset)
      else
        return await Model.find(filter).limit(limit).skip(offset).populate(populateFields)
    } else {
      log.d(mod, fun, `External references: ${json.beautify(extRefs)}`)

      // const FieldModel = this.getFieldModel(objectType)

      return await Model.find(filter).limit(limit).skip(offset)

    }
  } catch (err) {
    log.w(mod, fun, err)
    throw err
  }
}

exports.getObjectListWithProperties = async (objectType, filter, fields, limit, offset) => {
  const fun = `getObjectListWithProperties`
  // log.d(mod, fun, `fields: ${json.beautify(fields)}`)
  log.d(mod, fun, ``)
  try {
    const Model = this.getObjectModel(objectType)
    const populateFields = getPopulateFields(objectType)
    if (utils.isEmptyArray(populateFields))
      return await Model.findOne(filter, fields)
    else
      return await Model.findOne(filter, fields).populate(populateFields)
  } catch (err) {
    log.w(mod, fun, err)
    throw err
  }
}

exports.getObjectListCount = async (objectType, unionField, limit, offset) => {
  const fun = `getObjectListCount`
  log.d(mod, fun, ``)

  log.d(mod, fun, `objectType: ${objectType}, unionField: ${unionField}, limit: ${limit} / offset: ${offset} `)
  try {
    const Model = this.getObjectModel(objectType)
    const FieldModel = this.getFieldModel(objectType, unionField)
    /* beautify ignore:start */
    const objectList = await Model.aggregate([
      {'$unwind': `$${unionField}`},
      {'$group': {
        '_id': `$${unionField}`,
        'count': {'$sum': 1}
      }},
      {"$sort": {"count": -1}},
    ]).exec()
    /* beautify ignore:end */

    if (!FieldModel) {
      objectList.map(obj => {
        obj[unionField] = obj['_id']
        delete obj['_id']
      })
      return objectList
    } else {
      await Promise.all(objectList.map(async (obj) => {
        obj[unionField] = await FieldModel.findById(obj['_id'])
        delete obj['_id']
      }))

      return objectList
    }
  } catch (err) {
    log.w(mod, fun, err)
    throw err
  }
}

exports.getObjectListGroup = async (objectType, unionField, limit, offset) => {
  const fun = `getObjectListGroup`
  log.d(mod, fun, ``)
  log.d(mod, fun, `objectType: ${objectType}, unionField: ${unionField}, limit: ${limit} / offset${offset} `)

  try {
    const Model = this.getObjectModel(objectType)
    const FieldModel = this.getFieldModel(objectType, unionField)

    /* beautify ignore:start */
    const objectList = await Model.aggregate([
      {'$unwind': `$${unionField}`},
      {'$group': {
        '_id': `$${unionField}`,
        'count': {'$sum': 1},
        'list':{$push: {id:"$_id"}}
      }},
      {"$sort": {"count": -1}},
    ]).exec()
    /* beautify ignore:end */

    objectList.map(obj => {
      obj[unionField] = obj['_id']
      delete obj['_id']
    })

    if (!FieldModel) {

      await Promise.all(objectList.map(async (obj) => {
        const objList = obj.list
          .sort()
          .slice(offset, offset + limit)
        obj.list = await Model.populate(objList, {
          path: 'id',
          populate: getPopulateOptions(objectType)
        })
      }))
      return objectList
    } else {
      // log.d(mod, fun, `CollectionFrom: ${json.beautify(FieldModel)}`)

      const finalObjectList = await FieldModel.populate(objectList, unionField)
      await Promise.all(finalObjectList.map(async (obj) => {
        const objList = obj.list
          .sort()
          .slice(offset, offset + limit)
        obj.list = await Model.populate(objList, {
          path: 'id',
          populate: getPopulateOptions(objectType)
        })
      }))
      return finalObjectList
    }
  } catch (err) {
    log.w(mod, fun, err)
    throw err
  }
}

exports.updateObject = async (objectType, jsonUpdateData) => {
  const fun = `updateObject`
  log.d(mod, fun, ``)
  try {
    assertIsString(fun, objectType)

    log.d(mod, fun, `objectType: ${objectType}`)
    /* beautify ignore:start */
    const {Model, idField} = this.getObjectAccesses(objectType)
    const rudiId = json.accessProperty(jsonUpdateData, idField)
    const filter = {[idField]: rudiId}
    const updateOpts = {new: true}
    /* beautify ignore:end */

    const populateFields = getPopulateFields(objectType)
    if (utils.isEmptyArray(populateFields))
      return await Model.findOneAndUpdate(filter, jsonUpdateData, updateOpts)
    else
      return await Model.findOneAndUpdate(filter, jsonUpdateData, updateOpts).populate(populateFields)
  } catch (err) {
    log.w(mod, fun, err)
    throw err
  }
  // log.d(mod, fun, `updatedObject: ${json.beautify(updatedObject)}`)
  return updatedObject
}

exports.deleteObject = async (objectType, rudiId) => {
  const fun = `deleteObject`
  log.d(mod, fun, ``)
  try {
    if (!rudiId) throw new Error(`${msg.parameterExpected(fun, idField)}`)
    /* beautify ignore:start */
    const {Model, idField} = this.getObjectAccesses(objectType)
    const filter = {[idField]: rudiId}
    /* beautify ignore:end */
    const populateFields = getPopulateFields(objectType)
    if (utils.isEmptyArray(populateFields))
      return await Model.findOneAndRemove(filter)
    else
      return await Model.findOneAndRemove(filter).populate(populateFields)

  } catch (err) {
    log.w(mod, fun, err)
    throw err
  }
  return fullInfo
}

exports.deleteAll = async (objectType) => {
  const fun = `deleteAll`
  // log.d(mod, fun, `Model: ${Model}`)
  const Model = this.getObjectModel(objectType)
  try {
    return await Model.deleteMany()
  } catch (err) {
    log.w(mod, fun, err)
    throw err
  }
}

exports.deleteManyWithRudiIds = async (objectType, rudiIdList) => {
  const fun = `deleteManyWithRudiIds`
  // log.d(mod, fun, `conditions: ${conditions}`)

  // TODO: to be consolidated!
  // if (typeof (conditions) == 'string')

  if (!Array.isArray(rudiIdList)) {
    log.i(mod, fun, msg.parameterExpected(fun, 'rudiIdList'))
    return {
      "n": 0,
      "ok": 0,
      "deletedCount": 0
    }
  }

  /* beautify ignore:start */
  const {Model, idField} = this.getObjectAccesses(objectType)
  const filter = { [idField]: {$in: rudiIdList} }
  /* beautify ignore:end */

  log.d(mod, fun, json.beautify(filter))

  try {
    let deletionInfo = await Model.deleteMany(filter)
    return deletionInfo
  } catch (err) {
    log.w(mod, fun, err)
    throw err
  }
}

exports.deleteManyWithFilter = async (objectType, conditions) => {
  const fun = `deleteManyWithFilter`
  // log.d(mod, fun, `conditions: ${conditions}`)
  // TODO: to be consolidated!
  // if (typeof (conditions) == 'string')
  conditions = changeConditionsIntoRegex(conditions)

  const Model = this.getObjectModel(objectType)

  try {
    let deletionInfo = await Model.deleteMany(conditions)
    return deletionInfo
  } catch (err) {
    log.w(mod, fun, err)
    throw err
  }
}

function changeConditionsIntoRegex(conditions) {
  const fun = `changeConditionsIntoRegex`

  let regexConditions = {}
  Object.keys(conditions).forEach(key => {
    let regexp = new RegExp(conditions[key])
    log.d(mod, fun, regexp)
    regexConditions[key] = new RegExp(`^${conditions[key]}$`)
  })

  return regexConditions
}

// ---------------------------------------------------------------
// Specific functions
// ---------------------------------------------------------------

// ----------------------------------------
// - Metadata
// ----------------------------------------
exports.getMetadataWithJson = async (metadataJson) => {
  const fun = `getMetadataFromJson`
  log.d(mod, fun, ``)
  return await this.getObjectWithJson(URL_OBJECT_METADATA, metadataJson)
}

exports.getEnsuredMetadataWithJson = async (metadataJson) => {
  const fun = `getEnsuredMetadataFromJson`
  log.d(mod, fun, ``)
  return await this.getEnsuredObjectWithJson(URL_OBJECT_METADATA, metadataJson)
}

exports.getMetadataWithRudiId = async (rudiId) => {
  const fun = `getMetadataWithRudiId`
  log.d(mod, fun, ``)
  return await this.getObjectWithRudiId(URL_OBJECT_METADATA, rudiId)
}

exports.getEnsuredMetadataWithRudiId = async (rudiId) => {
  const fun = `getEnsuredMetadataWithRudiId`
  log.d(mod, fun, ``)
  return await this.getEnsuredObjectWithRudiId(URL_OBJECT_METADATA, rudiId)
}

exports.getMetadataList = async (limit, offset, filter, extRefs) => {
  const fun = `getAllMetadata`
  log.d(mod, fun, ``)
  // log.d(mod, fun, `METADATA_FIELDS_TO_POPULATE: ${METADATA_FIELDS_TO_POPULATE}`)

  return await this.getObjectList(URL_OBJECT_METADATA, limit, offset, filter, extRefs)
}

exports.updateMetadata = async (jsonMetadata) => {
  const fun = `updateMetadata`
  log.d(mod, fun, ``)

  // Checking incoming data for an id
  const id = jsonMetadata[API_METADATA_ID]
  if (!id) {
    throw new Error(`${msg.missingObjectProperty(jsonMetadata, API_METADATA_ID)}`)
  }

  // Checking that the metadata already exists
  const existingMetadata = await this.getMetadataWithRudiId(id)
  if (!existingMetadata) {
    throw new Error(`${msg.metadataNotFound(id)}`)
  }

  // Updating the ùetadata
  const updatedMetadata = await this.updateObject(URL_OBJECT_METADATA, jsonMetadata)

  return updatedMetadata
}

exports.deleteMetadata = async (metadataRudiId) => {
  const fun = `deleteOrganization`
  log.d(mod, fun, ``)

  // Checking the id parameter
  if (!metadataRudiId) {
    throw new Error(`${msg.parameterExpected(fun, API_METADATA_ID)}`)
  }

  // Checking that the metadata already exists
  if (!await this.doesObjectExistWithRudiId(URL_OBJECT_METADATA, metadataRudiId)) {
    throw new Error(`${msg.metadataNotFound(metadataRudiId)}`)
  }

  // Deleting the metadata
  const deletedMetadata = await this.deleteObject(URL_OBJECT_METADATA, metadataRudiId)

  return deletedMetadata
}

// ----------------------------------------
// - Organization
// ----------------------------------------
exports.getOrganizationWithJson = async (organizationJson) => {
  const fun = `getOrganizationWithJson`
  log.d(mod, fun, ``)
  return await this.getObjectWithJson(URL_OBJECT_ORGANIZATIONS, organizationJson)
}

exports.getEnsuredOrganizationWithJson = async (organizationJson) => {
  const fun = `getEnsuredOrganizationWithJson`
  log.d(mod, fun, ``)
  const rudiId = json.accessProperty(organizationJson, API_ORGANIZATION_ID)
  return await this.getEnsuredOrganizationWithRudiId(rudiId)
}

exports.getOrganizationWithRudiId = async (rudiId) => {
  const fun = `getOrganizationWithRudiId`
  log.d(mod, fun, ``)
  return await this.getObjectWithRudiId(URL_OBJECT_ORGANIZATIONS, rudiId)
}

exports.getEnsuredOrganizationWithRudiId = async (rudiId) => {
  const fun = `getEnsuredOrganizationWithRudiId`
  log.d(mod, fun, ``)
  return await this.getEnsuredObjectWithRudiId(URL_OBJECT_ORGANIZATIONS, rudiId)
}

exports.getOrganizationWithDbId = async (id) => {
  const fun = `getOrganizationWithDbId`
  log.d(mod, fun, ``)
  return await this.getObjectWithDbId(URL_OBJECT_ORGANIZATIONS, id)
}

exports.getEnsuredOrganizationWithDbId = async (dbId) => {
  const fun = `getOrganizationWithDbId`
  log.d(mod, fun, ``)
  return await this.getEnsuredObjectWithDbId(URL_OBJECT_ORGANIZATIONS, dbId)
}

exports.getEnsuredOrganizationDbIdWithJson = async (organizationJson) => {
  const fun = `getEnsuredOrganizationDbIdWithJson`
  log.d(mod, fun, ``)
  return await this.getEnsuredDbIdWithJson(URL_OBJECT_ORGANIZATIONS, organizationJson)
}

exports.getOrganizationDbIdWithJson = async (organizationJson) => {
  const fun = `getEnsuredOrganizationDbIdWithJson`
  log.d(mod, fun, ``)
  return await this.getDbIdWithJson(URL_OBJECT_ORGANIZATIONS, organizationJson)
}

exports.getAllOrganizations = async () => {
  const fun = `getAllOrganizations`
  log.d(mod, fun, ``)

  const organizationList = await Organization.find({})
  // log.d(mod, fun, `metadataList: ${metadataList}`)

  return organizationList
}

exports.updateOrganization = async (jsonOrganization) => {
  const fun = `updateOrganization`
  log.d(mod, fun, ``)

  // Checking incoming data for an id
  const id = jsonOrganization[API_ORGANIZATION_ID]
  if (!id) {
    throw new Error(`${msg.missingObjectProperty(jsonOrganization, API_ORGANIZATION_ID)}`)
  }

  // Checking that the organization already exists
  const existingOrganization = await this.getOrganizationWithRudiId(id)
  if (!existingOrganization) {
    throw new Error(`${msg.organizationNotFound(id)}`)
  }

  // Updating the organization
  const updatedOrganization = await this.updateObject(URL_OBJECT_ORGANIZATIONS, jsonOrganization)
  log.d(mod, fun, `${msg.organizationUpdated(id)}`)

  return updatedOrganization
}

exports.deleteOrganization = async (organizationRudiId) => {
  const fun = `deleteOrganization`
  log.d(mod, fun, ``)

  // Checking the id parameter
  if (!organizationRudiId) {
    throw new Error(`${msg.parameterExpected(fun, API_ORGANIZATION_ID)}`)
  }

  // Checking that the organization already exists
  const existingOrganization = await this.getEnsuredOrganizationWithRudiId(organizationRudiId)

  // Deleting the organization
  const deletedOrganization = await this.deleteObject(URL_OBJECT_ORGANIZATIONS, organizationRudiId)
  log.d(mod, fun, `${msg.organizationDeleted(organizationRudiId)}`)

  return deletedOrganization
}

// ----------------------------------------
// - Contacts
// ----------------------------------------

exports.getContactWithRudiId = async (contactRudiId) => {
  const fun = `getContactWithRudiId`
  log.d(mod, fun, ``)
  return await this.getObjectWithRudiId(URL_OBJECT_CONTACTS, contactRudiId)
}

exports.getEnsuredContactWithRudiId = async (contactRudiId) => {
  const fun = `getEnsuredContactWithRudiId`
  log.d(mod, fun, ``)
  return await this.getEnsuredObjectWithRudiId(URL_OBJECT_CONTACTS, contactRudiId)
}

exports.getContactWithJson = async (contactJson) => {
  const fun = `getContactWithJson`
  log.d(mod, fun, ``)
  return await this.getObjectWithJson(URL_OBJECT_CONTACTS, contactJson)
}

exports.getEnsuredContactWithJson = async (contactJson) => {
  const fun = `getEnsuredContactWithJson`
  log.d(mod, fun, ``)
  return await this.getEnsuredObjectWithJson(URL_OBJECT_CONTACTS, contactJson)
}

exports.getContactWithDbId = async (contactDbId) => {
  const fun = `getContactWithDbId`
  log.d(mod, fun, ``)
  return await this.getObjectWithDbId(URL_OBJECT_CONTACTS, contactDbId)
}

exports.getEnsuredContactWithDbId = async (contactDbId) => {
  const fun = `getEnsuredContactWithDbId`
  log.d(mod, fun, ``)
  return await this.getEnsuredObjectWithDbId(URL_OBJECT_CONTACTS, contactDbId)
}

exports.getContactDbIdWithJson = async (contactJson) => {
  const fun = `getContactDbIdWithJson`
  log.d(mod, fun, ``)
  return await this.getDbIdWithJson(URL_OBJECT_CONTACTS, contactJson)
}

exports.getEnsuredContactDbIdWithJson = async (contactJson) => {
  const fun = `getEnsuredContactDbIdWithJson`
  log.d(mod, fun, ``)
  return await this.getEnsuredDbIdWithJson(URL_OBJECT_CONTACTS, contactJson)
}

exports.getAllContacts = async () => {
  const fun = `getAllContacts`
  log.d(mod, fun, ``)
  return await Contact.find({})
}

exports.updateContact = async (jsonContact) => {
  const fun = `updateContact`
  log.d(mod, fun, ``)

  // Checking incoming data for an id
  const rudiId = json.accessProperty(jsonContact, API_CONTACT_ID)

  // Checking that the contact already exists
  this.getEnsuredContactWithRudiId(rudiId)

  // Updating the contact
  const updatedcontact = await this.updateObject(URL_OBJECT_CONTACTS, jsonContact)
  log.d(mod, fun, `${msg.contactUpdated(rudiId)}`)

  return updatedcontact
}

exports.deleteContact = async (contactRudiId) => {
  const fun = `deleteContact`
  log.d(mod, fun, ``)

  // Checking the id parameter
  if (!contactRudiId) {
    throw new Error(`${msg.parameterExpected(fun, API_CONTACT_ID)}`)
  }

  // Checking that the contact already exists
  await this.getEnsuredContactWithRudiId(contactRudiId)

  // Deleting the contact
  const deletedContact = await this.deleteObject(URL_OBJECT_CONTACTS, contactRudiId)
  log.d(mod, fun, `${msg.contactDeleted(contactRudiId)}`)

  return deletedContact
}

// ----------------------------------------
// - Media
// ----------------------------------------
exports.getMediaDbIdWithJson = async (mediaJson) => {
  const fun = `getMediaDbIdWithJson`
  log.d(mod, fun, ``)
  // log.d(mod, fun, `URL_OBJECT_MEDIA: ${URL_OBJECT_MEDIA}`)
  // log.d(mod, fun, `API_MEDIA_ID: ${API_MEDIA_ID}`)
  // log.d(mod, fun, `mediaJson: ${json.beautify(mediaJson)}`)
  // log.d(mod, fun, `media dbType: ${json.beautify(mediaJson[API_MEDIA_TYPE_PROPERTY])}`)
  return await this.getDbIdWithJson(URL_OBJECT_MEDIA, mediaJson)
}

exports.getEnsuredMediaDbIdWithJson = async (mediaJson) => {
  const fun = `getEnsuredMediaDbIdWithJson`
  log.d(mod, fun, ``)
  // log.d(mod, fun, `URL_OBJECT_MEDIA: ${URL_OBJECT_MEDIA}`)
  // log.d(mod, fun, `API_MEDIA_ID: ${API_MEDIA_ID}`)
  // log.d(mod, fun, `mediaJson: ${json.beautify(mediaJson)}`)
  // log.d(mod, fun, `media dbType: ${json.beautify(mediaJson[API_MEDIA_TYPE_PROPERTY])}`)
  return await this.getEnsuredDbIdWithJson(URL_OBJECT_MEDIA, mediaJson)
}

exports.getMediaWithDbId = async (mediaDbId) => {
  const fun = `getMediaWithDbId`
  log.d(mod, fun, ``)
  return await this.getObjectWithDbId(URL_OBJECT_MEDIA, mediaDbId)
}

exports.getEnsuredMediaWithDbId = async (mediaDbId) => {
  const fun = `getEnsuredMediaWithDbId`
  log.d(mod, fun, ``)
  return await this.getEnsuredObjectWithDbId(URL_OBJECT_MEDIA, mediaDbId)
}

// ----------------------------------------
// - SKOS: Scheme
// ----------------------------------------
exports.getSchemeDbIdWithJson = async (schemeJson) => {
  const fun = `getSchemeDbIdWithJson`
  log.d(mod, fun, ``)
  return await this.getDbIdWithJson(URL_OBJECT_SKOS_SCHEME, schemeJson)
}

exports.getSchemeDbIdWithRudiId = async (schemeRudiId) => {
  const fun = `getSchemeDbIdWithRudiId`
  log.d(mod, fun, ``)
  return await this.getDbIdWithRudiId(URL_OBJECT_SKOS_SCHEME, schemeRudiId)
}

exports.getEnsuredSchemeDbIdWithRudiId = async (schemeRudiId) => {
  const fun = `getEnsuredSchemeDbIdWithRudiId`
  log.d(mod, fun, ``)
  return await this.getEnsuredDbIdWithRudiId(URL_OBJECT_SKOS_SCHEME, schemeRudiId)
}

exports.getSchemeRudiIdWithDbId = async (schemeDbId) => {
  const fun = `getEnsuredSchemeDbIdWithRudiId`
  log.d(mod, fun, ``)
  return await this.getObjectPropertiesWithDbId(URL_OBJECT_SKOS_SCHEME, schemeDbId, [API_SKOS_SCHEME_ID])
}

exports.getSchemeWithDbId = async (schemeDbId) => {
  const fun = `getSchemeWithDbId`
  log.d(mod, fun, ``)
  return await this.getObjectWithDbId(URL_OBJECT_SKOS_SCHEME, schemeDbId)
}

exports.getEnsuredSchemeWithDbId = async (schemeDbId) => {
  const fun = `getSchemeJsonIdWithDbId`
  log.d(mod, fun, ``)
  return await this.getEnsuredObjectWithDbId(URL_OBJECT_SKOS_SCHEME, schemeDbId)
}
/*
exports.getEnsuredSchemeWithCode = async (schemeCode) => {
  const fun = `getSchemeJsonIdWithDbId`
  log.d(mod, fun, ``)
  return this.getEnsuredObjectWithRudiId(URL_OBJECT_SKOS_SCHEME, SkosScheme, schemeDbId)
}
 */
// ----------------------------------------
// - SKOS: Concept
// ----------------------------------------

exports.getConceptWithDbId = async (conceptDbId) => {
  const fun = `getConceptWithDbId`
  log.d(mod, fun, ``)
  return await this.getObjectWithDbId(SkosConcept, conceptDbId)
}

exports.getConceptRudiIdWithDbId = async (conceptDbId) => {
  const fun = `getConceptRudiIdWithDbId`
  log.d(mod, fun, ``)
  return await this.getObjectPropertiesWithDbId(URL_OBJECT_SKOS_CONCEPT, [API_SKOS_CONCEPT_ID])
}

exports.getConceptWithJson = async (conceptJson) => {
  const fun = `getConceptWithJson`
  log.d(mod, fun, ``)
  return await this.getObjectWithJson(URL_OBJECT_SKOS_CONCEPT, conceptJson)
}

exports.getConceptDbIdWithJson = async (conceptJson) => {
  const fun = `getConceptDbIdWithJson`
  log.d(mod, fun, ``)
  return await this.getDbIdWithJson(URL_OBJECT_SKOS_CONCEPT, conceptJson)
}

exports.getConceptDbIdWithRudiId = async (conceptRudiId) => {
  const fun = `getConceptDbIdWithRudiId`
  log.d(mod, fun, ``)
  return await this.getDbIdWithRudiId(URL_OBJECT_SKOS_CONCEPT, conceptRudiId)
}

exports.getAllConcepts = async () => {
  const fun = `getAllConcepts`
  log.d(mod, fun, ``)

  const conceptList = await SkosConcept.find({})
  return conceptList
}

exports.getAllConceptsFromScheme = async (schemeCode) => {
  const fun = `getAllConceptsFromScheme`
  log.d(mod, fun, ``)

  const conceptList = await SkosConcept.find({
    [API_SKOS_SCHEME_CODE]: schemeCode
  })
  return conceptList
}

exports.getAllConceptsWithRole = async (conceptRole) => {
  const fun = `getAllConceptsWithRole`
  log.d(mod, fun, ``)

  const conceptList = await SkosConcept.find({
    [API_SKOS_CONCEPT_ROLE]: conceptRole
  })
  return conceptList
}

// ----------------------------------------
// - Filters
// ----------------------------------------
exports.findNotReferencedInMetadata = (objectType) => {
  const fun = `isReferencedInMetadata`
  log.d(mod, fun, ``)

}

exports.isReferencedInMetadata = async (objectType, rudiId) => {
  const fun = `isReferencedInMetadata`
  log.d(mod, fun, `${objectType}: ${rudiId}`)

  // const truc1 = await (await Contact.findOne({[API_CONTACT_ID]: rudiId}, '_id')).toObject()
  // const truc = await Contact.findOne({[API_CONTACT_ID]: rudiId}, '_id')
  // const truc2 = await truc.toObject()
  // log.d(mod, fun, `truc: ${json.beautify(truc2)}`)
  let dbId
  try {
    dbId = await (await this.getObjectPropertiesWithRudiId(objectType, rudiId, [DB_ID])).toObject()[DB_ID]
  } catch (err) {
    const errMsg = msg.objectNotFound(objectType, rudiId)
    log.w(mod, fun, errMsg)
    throw new Error(errMsg)
  }

  log.d(mod, fun, `dbId: ${json.beautify(dbId)}`)

  let metadataFilter, res
  switch (objectType) {
    case URL_OBJECT_ORGANIZATIONS:
      metadataFilter = {
        $or: [
          /* beautify ignore:start */
          {[API_DATA_PRODUCER_PROPERTY]: dbId},
          {[`${API_METAINFO_PROPERTY}.${API_METAINFO_PROVIDER_PROPERTY}`]: dbId}
          /* beautify ignore:end */
        ]
      }
      break
    case URL_OBJECT_CONTACTS:
      metadataFilter = {
        $or: [
          /* beautify ignore:start */
          {[API_DATA_CONTACTS_PROPERTY]: dbId},
          {[`${API_METAINFO_PROPERTY}.${API_METAINFO_CONTACTS_PROPERTY}`]: dbId}
          /* beautify ignore:end */
        ]
      }
      break
    case URL_OBJECT_MEDIA:
      metadataFilter = {
        [`${API_MEDIA_PROPERTY}`]: dbId
      }
      break
    default:
      throw new Error(msg.objectTypeNotFound(objectType))
  }
  res = await Metadata.findOne(metadataFilter, API_METADATA_ID)
  log.d(mod, fun, `res: ${json.beautify(res)}`)
  return !!res
  // res = await Metadata.find(metadataFilter, API_METADATA_ID)
  // return !!utils.isEmptyArray(res)
}
// ensure the organization is not in metadata.producer
// ensure the organization is not in metadata.metainfo.provider
exports.isOrgUsedInMetadata = async (dbOrg) => {
  const fun = `isOrgUsedInMetadata`
  log.d(mod, fun, `dbOrg: ${json.beautify(dbOrg)}`)

  // retrieving the DB id for the organization
  const orgDbId = dbOrg[DB_ID]
  log.d(mod, fun, `orgDbId: ${orgDbId}`)

  // checking if the organization is referenced by a metadata in field API_DATA_PRODUCER_PROPERTY
  const orgQuery = {}
  orgQuery[`${API_DATA_PRODUCER_PROPERTY}`] = mongoose.Types.ObjectId(orgDbId)
  // log.d(mod, fun, `orgQuery: ${json.beautify(orgQuery)}`)
  const metadataWithProducer = await Metadata.findOne(orgQuery)

  log.d(mod, fun, `metadataWithProducer: ${json.beautify(metadataWithProducer)}`)
  if (null != metadataWithProducer) return true

  // checking if the organization is referenced by a metadata in field API_METAINFO_PROPERTY.API_METAINFO_PROVIDER_PROPERTY
  const metaInfoOrgQuery = {}
  metaInfoOrgQuery[`${API_METAINFO_PROPERTY}.${API_METAINFO_PROVIDER_PROPERTY}`] = mongoose.Types.ObjectId(orgDbId)
  // log.d(mod, fun, `metaInfoOrgQuery: ${json.beautify(metaInfoOrgQuery)}`)

  const metadataWithMetaInfoProvider = await Metadata.findOne(metaInfoOrgQuery)
  log.d(mod, fun, `metadataWithMetaInfoProvider: ${json.beautify(metadataWithMetaInfoProvider)}`)
  // return (null != metadataWithMetaInfoProvider)
  return (null != metadataWithMetaInfoProvider)
}

// what? filtering nested array
// how-> https://www.devsbedevin.net/mongodb-find-findone-with-nested-array-filtering-finally/

// ensure the contact is not in metadata.contacts
// ensure the contact is not in metadata.metainfo.contacts
exports.isContactUsedInMetadata = async (dbContact) => {
  const fun = `isContactUsedInMetadata`
  log.d(mod, fun, `dbContact: ${json.beautify(dbContact)}`)

  // retrieving the DB id for the organization
  const contactDbId = dbContact[DB_ID]
  log.d(mod, fun, `contactDbId: ${contactDbId}`)

  // checking if the contact is referenced by a metadata in field API_DATA_CONTACTS_PROPERTY
  const contactsQuery = {}
  contactsQuery[`${API_DATA_CONTACTS_PROPERTY}`] = mongoose.Types.ObjectId(contactDbId)
  log.d(mod, fun, `contactsQuery: ${json.beautify(contactsQuery)}`)

  const metadataWithContact = await Metadata.findOne(contactsQuery)
  log.d(mod, fun, `metadataWithContact: ${json.beautify(metadataWithContact)}`)
  if (null != metadataWithContact) return true

  // checking if the contact is referenced by a metadata in field API_METAINFO_PROPERTY.API_METAINFO_CONTACTS_PROPERTY
  const metaInfoContactsQuery = {}
  metaInfoContactsQuery[`${API_METAINFO_PROPERTY}.${API_METAINFO_CONTACTS_PROPERTY}`] = mongoose.Types.ObjectId(contactDbId)
  // log.d(mod, fun, `metaInfoContactsQuery: ${json.beautify(metaInfoContactsQuery)}`)

  const metadataWithMetaInfoContact = await Metadata.findOne(metaInfoContactsQuery)
  log.d(mod, fun, `dbObjectWithMetaInfoContact: ${json.beautify(metadataWithMetaInfoContact)}`)
  return (null != metadataWithMetaInfoContact)
}