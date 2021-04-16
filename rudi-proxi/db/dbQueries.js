'use strict';
const mod = 'db'
/*
 * In this file are made the different calls to the database
 */

//---------------------------------------------------------------
//---------------------------------------------------------------
// External dependancies 
//---------------------------------------------------------------
const boom = require('@hapi/boom')
const mongoose = require('mongoose')

//---------------------------------------------------------------
// Internal dependencies
//---------------------------------------------------------------
const log = require('../utils/logging')
const msg = require('../utils/msg')

const json = require('../utils/jsonAccess')
const utils = require('../utils/jsUtils')

//---------------------------------------------------------------
// Constants
//---------------------------------------------------------------
const {
  PARAM_ID,
  URL_OBJECT_METADATA,
  URL_OBJECT_ORGANIZATIONS,
  URL_OBJECT_CONTACTS,
  URL_OBJECT_MEDIA,
  URL_OBJECT_SKOS_SCHEME,
  URL_OBJECT_SKOS_CONCEPT,
  URL_ACTION_REPORT,
  URL_LICENCE_SUFFIX: URL_OBJECT_LICENCES,
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
  API_SKOS_CONCEPT_ROLE
} = require('./dbFields')

//---------------------------------------------------------------
// Data models
//---------------------------------------------------------------
const Metadata = require('../definitions/models/Metadata')
const Organization = require('../definitions/models/Organization')
const Contact = require('../definitions/models/Contact');
const {
  Media
} = require('../definitions/models/Media');
const Report = require('../definitions/models/Report');
const SkosScheme = require('../definitions/models/SkosScheme');
const SkosConcept = require('../definitions/models/SkosConcept');
const { LicenceSchemeCode } = require('../config/confSKOS');



//---------------------------------------------------------------
// Specific object accesses
//---------------------------------------------------------------
exports.getObjectAccesses = (objectType) => {
  const fun = 'getObjectAccesses'
  // log.d(mod, fun, ``)

  switch (objectType) {
    case URL_OBJECT_METADATA:
      return {
        Model: Metadata, idField: API_METADATA_ID
      }
    case URL_OBJECT_ORGANIZATIONS:
      return {
        Model: Organization, idField: API_ORGANIZATION_ID
      }
    case URL_OBJECT_CONTACTS:
      return {
        Model: Contact, idField: API_CONTACT_ID
      }
    case URL_OBJECT_MEDIA:
      return {
        Model: Media, idField: API_MEDIA_ID
      }
    case URL_OBJECT_SKOS_SCHEME:
      return {
        Model: SkosScheme, idField: API_SKOS_SCHEME_ID
      }
    case URL_OBJECT_SKOS_CONCEPT:
      return {
        Model: SkosConcept, idField: API_SKOS_CONCEPT_ID
      }
   case URL_OBJECT_LICENCES:
      return {
        Model: SkosConcept, idField: API_SKOS_CONCEPT_ID
      }
    case URL_ACTION_REPORT:
      return {
        Model: Report, idField: API_REPORT_ID
      }
    default:
      throw new Error(msg.objectTypeNotFound(objectType))
  }
}

//---------------------------------------------------------------
// Actions on DB tables
//---------------------------------------------------------------
exports.getCollections = async () => {
  const fun = `getCollections`
  try {
    const collections = await mongoose.connection.db.listCollections().toArray()

    collections.map((collection) => {
      log.v(mod, fun, `${json.beautify(collection.name)}`)
    })
    return collections
  } catch (err) {
    log.e(mod, fun, err)
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
    log.e(mod, fun, err)
    throw err
  }
}
//---------------------------------------------------------------
// Generic functions
//---------------------------------------------------------------
exports.getDbIdWithRudiId = async (objectType, Model, idField, rudiId) => {
  const fun = `getDbIdWithRudiId`
  log.d(mod, fun, ``)
  // log.d(mod, fun, `objectType: ${objectType}`)
  // log.d(mod, fun, `idField: ${idField}`)
  // log.d(mod, fun, `rudiId: ${rudiId}`)
  try {
    /* beautify ignore:start */
    const dbObject = await Model.findOne({[idField]: rudiId})
    /* beautify ignore:end */
    return !dbObject ? null : json.accessProperty(dbObject, DB_ID)
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}

exports.getEnsuredDbIdWithRudiId = async (objectType, Model, idField, rudiId) => {
  const fun = `getEnsuredDbIdWithRudiId`
  log.d(mod, fun, ``)
  // log.d(mod, fun, `objectType: ${objectType}`)
  // log.d(mod, fun, `idField: ${idField}`)
  // log.d(mod, fun, `rudiId: ${rudiId}`)
  try {
    /* beautify ignore:start */
    const dbObject = await Model.findOne({[idField]: rudiId})
    /* beautify ignore:end */
    if (!dbObject) throw new Error(`${msg.objectNotFound(objectType, rudiId)}`)
    const dbId = json.accessProperty(dbObject, DB_ID)
    return dbId
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}

exports.getDbIdWithJson = async (objectType, Model, idField, rudiObject) => {
  const fun = `getDbIdWithJson`
  log.d(mod, fun, ``)
  // log.d(mod, fun, `objectType: ${objectType}`)
  // log.d(mod, fun, `idField: ${idField}`)
  // log.d(mod, fun, `jsonObject: ${json.beautify(jsonObject)}`)
  try {
    const rudiId = json.accessProperty(rudiObject, idField)
    return await this.getDbIdWithRudiId(objectType, Model, idField, rudiId)
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}

exports.getEnsuredDbIdWithJson = async (objectType, Model, idField, rudiObject) => {
  const fun = `getEnsuredDbIdWithJson`
  log.d(mod, fun, ``)
  // log.d(mod, fun, `objectType: ${objectType}`)
  // log.d(mod, fun, `idField: ${idField}`)
  // log.d(mod, fun, `jsonObject: ${json.beautify(jsonObject)}`)
  try {
    const rudiId = json.accessProperty(rudiObject, idField)
    return await this.getEnsuredDbIdWithRudiId(objectType, Model, idField, rudiId)
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}

exports.getObjectWithRudiId = async (Model, idField, rudiId) => {
  const fun = `getObjectWithRudiId`
  // log.d(mod, fun, ``)
  try {
    if (!rudiId) throw new Error(`${msg.parameterExpected(fun, PARAM_ID)}`)
    /* beautify ignore:start */
    const dbObject = await Model.findOne({[idField]: rudiId})
    /* beautify ignore:end */
    // log.d(mod, fun, `${rudiId} -> ${json.beautify(dbObject)}\n`)

    return dbObject
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}

exports.getObjectWithField = async (Model, fieldName, fieldValue) => {
  const fun = `getObjectWithField`
  // log.d(mod, fun, ``)
  try {
    if (!fieldName) throw new Error(`${msg.parameterExpected(fun, 'field name')}`)
    /* beautify ignore:start */
    const dbObject = await Model.findOne({[fieldName]: fieldValue})
    /* beautify ignore:end */
    // log.d(mod, fun, `${rudiId} -> ${json.beautify(dbObject)}\n`)

    return dbObject
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}

exports.getEnsuredObjectWithRudiId = async (objectType, Model, idField, rudiId) => {
  const fun = `getEnsuredObjectWithRudiId`
  log.d(mod, fun, ``)

  if (!rudiId) throw new Error(`${msg.parameterExpected(fun, PARAM_ID)}`)
  else log.d(mod, fun, `RUDI id: ${rudiId}`)
  const dbObject = await this.getObjectWithRudiId(Model, idField, rudiId)
  log.d(mod, fun, `${rudiId} -> ${json.beautify(dbObject)}`)
  if (!dbObject) throw new Error(`${msg.objectNotFound(objectType, rudiId)}`)
  return dbObject
}

exports.getObjectWithJson = async (Model, idField, rudiObject) => {
  const fun = `getObjectWithJson`
  log.d(mod, fun, ``)
  try {
    const rudiId = json.accessProperty(rudiObject, idField)
    const dbObject = await this.getObjectWithRudiId(Model, idField, rudiId)
    return dbObject
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}

exports.getEnsuredObjectWithJson = async (objectType, Model, idField, rudiObject) => {
  const fun = `getEnsuredObjectWithJson`
  log.d(mod, fun, ``)
  try {
    if (!Model || !idField) {
      /* beautify ignore:start */
      const {Model, idField} = this.getObjectAccesses(objectType)
      /* beautify ignore:end */
    }
    const rudiId = json.accessProperty(rudiObject, idField)
    const dbObject = await this.getObjectWithRudiId(Model, idField, rudiId)
    if (!dbObject) throw new Error(`${msg.objectNotFound(objectType, rudiId)}`)
    return dbObject
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}

exports.getObjectWithDbId = async (Model, dbId) => {
  const fun = `getObjectWithDbId`
  log.d(mod, fun, ``)
  try {
    /* beautify ignore:start */
    const dbObject = await Model.findOne({[DB_ID]: dbId})
    /* beautify ignore:end */
    return dbObject
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}

exports.getObjectPropertyWithDbId = async (Model, dbId, prop) => {
  const fun = `getObjectWithDbId`
  log.d(mod, fun, ``)
  try {
    /* beautify ignore:start */
    const dbObject = await Model.findOne({[DB_ID]: dbId})
    /* beautify ignore:end */
    if (!dbObject) return {}
    return dbObject[prop]
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}

exports.getEnsuredObjectWithDbId = async (objectType, Model, dbId) => {
  const fun = `getEnsuredObjectWithDbId`
  log.d(mod, fun, ``)
  try {
    const dbObject = await this.getObjectWithDbId(Model, dbId)
    if (!dbObject) throw new Error(`${msg.objectNotFound(objectType, dbId)}`)
    return dbObject
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}

exports.doesObjectExistWithRudiId = async (Model, idField, rudiId) => {
  const fun = `doesObjectExistWithRudiId`
  log.d(mod, fun, ``)
  try {
    const dbObject = await this.getObjectWithRudiId(Model, idField, rudiId)
    log.d(mod, fun, `existingObject: ${json.beautify(dbObject)}`)
    return (!!dbObject)
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}

exports.doesObjectExistWithJson = async (Model, idField, rudiObject) => {
  const fun = `doesObjectExistWithJson`
  log.d(mod, fun, ``)
  try {
    const dbObject = await this.getObjectWithJson(Model, idField, rudiObject)
    return (!!dbObject)
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}

exports.getObjectList = async (Model, limit, offset) => {
  const fun = `getObjectList`
  log.d(mod, fun, ``)
  // log.d(mod, fun, `filter.limit: ${filter.limit}, filter.offset: ${filter.skip}`)
  try {
    limit = limit || 0
    offset = offset || 0
    const objectList = await Model.find({}).limit(limit).skip(offset)
    return objectList
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}

exports.getObjectListFiltered = async (Model, filter, limit, offset) => {
  const fun = `getObjectListFiltered`
  try {
    limit = limit || 0
    offset = offset || 0
    log.d(mod, fun, `limit: ${limit}, offset: ${offset}, filter: ${json.beautify(filter)}`)
    const objectList = await Model.find(filter) // .limit(limit).skip(offset)
    log.d(mod, fun, `found: ${json.beautify(objectList)}`)
    return objectList
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}

exports.updateObject = async (Model, idField, jsonUpdateData) => {
  const fun = `updateObject`
  log.d(mod, fun, ``)

  const id = json.accessProperty(jsonUpdateData, idField)

  let updatedObject = ''
  try {
    updatedObject = await Model.findOneAndUpdate({
      [idField]: jsonUpdateData[idField]
    }, jsonUpdateData, {
      new: true
    })
    return updatedObject
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
  log.d(mod, fun, `updatedObject: ${json.beautify(updatedObject)}`)
  return updatedObject
}

exports.deleteObject = async (Model, idField, id) => {
  const fun = `deleteObject`
  log.d(mod, fun, ``)
  if (!id) {
    throw new Error(`${msg.parameterExpected(fun, idField)}`)
  }
  let condition = {}
  condition[idField] = id
  try {

    let deletionInfo = await Model.findOneAndRemove(condition)

    return deletionInfo
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
  return fullInfo
}

exports.deleteAll = async (Model) => {
  const fun = `deleteAll`
  // log.d(mod, fun, `Model: ${Model}`)

  try {
    let deletionInfo = await Model.deleteMany()
    return deletionInfo
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}

exports.deleteManyWithRudiIds = async (Model, idField, rudiIdList) => {
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
  let filter = {}
  /* beautify ignore:start */
  filter[idField] = {$in: rudiIdList}
  /* beautify ignore:end */
  log.d(mod, fun, json.beautify(filter))

  try {
    let deletionInfo = await Model.deleteMany(filter)
    return deletionInfo
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}

exports.deleteManyWithFilter = async (Model, conditions) => {
  const fun = `deleteManyWithFilter`
  // log.d(mod, fun, `conditions: ${conditions}`)

  // TODO: to be consolidated!
  // if (typeof (conditions) == 'string')
  conditions = changeConditionsIntoRegex(conditions)

  try {
    let deletionInfo = await Model.deleteMany(conditions)
    return deletionInfo
  } catch (err) {
    log.e(mod, fun, err)
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

// Depleted
exports.setPublishedFlag = async (Model, idField, rudiId) => {
  const fun = `setPublishedFlag`
  log.d(mod, fun, `rudiId: ${rudiId}`)

  /* beautify ignore:start */
  const filter = {[idField]: rudiId}
  const update = {'publishedAt': utils.nowISO()}
  const options = {new: true}
  /* beautify ignore:end */

  const updatedObject = await Model.findOneAndUpdate(filter, update, options)
  log.d(mod, fun, `updatedObject: ${json.beautify(updatedObject)}`)
  return updatedObject
}

//---------------------------------------------------------------
// Specific functions
//---------------------------------------------------------------

//---------------------------------------- 
// - Metadata
//---------------------------------------- 
exports.getMetadataWithJson = async (metadataJson) => {
  const fun = `getMetadataFromJson`
  log.d(mod, fun, ``)
  return this.getObjectWithJson(Metadata, API_METADATA_ID, metadataJson)
}

exports.getEnsuredMetadataWithJson = async (metadataJson) => {
  const fun = `getEnsuredMetadataFromJson`
  log.d(mod, fun, ``)
  return this.getEnsuredObjectWithJson(URL_OBJECT_METADATA, Metadata, API_METADATA_ID, metadataJson)
}

exports.getMetadataWithRudiId = async (rudiId) => {
  const fun = `getMetadataFromRudiId`
  log.d(mod, fun, ``)
  return this.getObjectWithRudiId(Metadata, API_METADATA_ID, rudiId)
}

exports.getEnsuredMetadataWithRudiId = async (rudiId) => {
  const fun = `getEnsuredMetadataFromRudiId`
  log.d(mod, fun, ``)
  return this.getEnsuredObjectWithRudiId(URL_OBJECT_METADATA, Metadata, API_METADATA_ID, rudiId)
}

exports.getAllMetadata = async () => {
  const fun = `getAllMetadata`
  log.d(mod, fun, ``)

  const metadataList = await Metadata.find({})
  // log.d(mod, fun, `metadataList: ${metadataList}`)

  return metadataList
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

  // Updating the organization
  const updatedMetadata = await this.updateObject(Metadata, API_METADATA_ID, jsonMetadata)

  return updatedMetadata
}

exports.deleteMetadata = async (metadataRudiId) => {
  const fun = `deleteOrganization`
  log.d(mod, fun, ``)

  // Checking the id parameter
  if (!metadataRudiId) {
    throw new Error(`${msg.parameterExpected(fun, API_METADATA_ID)}`)
  }

  // Checking that the organization already exists
  if (!await this.doesObjectExistWithRudiId(Metadata, API_METADATA_ID, metadataRudiId)) {
    throw new Error(`${msg.metadataNotFound(metadataRudiId)}`)
  }

  // Deleting the organization
  const deletedOrganization = await this.deleteObject(Metadata, API_METADATA_ID, metadataRudiId)
  log.d(mod, fun, `${msg.organizationDeleted(metadataRudiId)}`)

  return deletedOrganization
}

//---------------------------------------- 
// - Organization
//---------------------------------------- 
exports.getOrganizationWithJson = async (organizationJson) => {
  const fun = `getOrganizationWithJson`
  log.d(mod, fun, ``)
  return this.getObjectWithJson(Organization, API_ORGANIZATION_ID, organizationJson)
}

exports.getEnsuredOrganizationWithJson = async (organizationJson) => {
  const fun = `getEnsuredOrganizationWithJson`
  log.d(mod, fun, ``)
  const rudiId = json.accessProperty(organizationJson, API_ORGANIZATION_ID)
  return this.getEnsuredOrganizationWithRudiId(rudiId)
}

exports.getOrganizationWithRudiId = async (rudiId) => {
  const fun = `getOrganizationWithRudiId`
  log.d(mod, fun, ``)
  return this.getObjectWithRudiId(Organization, API_ORGANIZATION_ID, rudiId)
}

exports.getEnsuredOrganizationWithRudiId = async (rudiId) => {
  const fun = `getEnsuredOrganizationWithRudiId`
  log.d(mod, fun, ``)
  return this.getEnsuredObjectWithRudiId(URL_OBJECT_ORGANIZATIONS, Organization, API_ORGANIZATION_ID, rudiId)
}

exports.getOrganizationWithDbId = async (id) => {
  const fun = `getOrganizationWithDbId`
  log.d(mod, fun, ``)
  return this.getObjectWithDbId(Organization, id)
}

exports.getEnsuredOrganizationWithDbId = async (dbId) => {
  const fun = `getOrganizationWithDbId`
  log.d(mod, fun, ``)
  return this.getEnsuredObjectWithDbId(URL_OBJECT_ORGANIZATIONS, Organization, dbId)
}

exports.getEnsuredOrganizationDbIdWithJson = async (organizationJson) => {
  const fun = `getEnsuredOrganizationDbIdWithJson`
  log.d(mod, fun, ``)
  return this.getEnsuredDbIdWithJson(URL_OBJECT_ORGANIZATIONS, Organization, API_ORGANIZATION_ID, organizationJson)
}

exports.getOrganizationDbIdWithJson = async (organizationJson) => {
  const fun = `getEnsuredOrganizationDbIdWithJson`
  log.d(mod, fun, ``)
  return this.getDbIdWithJson(URL_OBJECT_ORGANIZATIONS, Organization, API_ORGANIZATION_ID, organizationJson)
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
  const updatedOrganization = await this.updateObject(Organization, API_ORGANIZATION_ID, jsonOrganization)
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
  const deletedOrganization = await this.deleteObject(Organization, API_ORGANIZATION_ID, organizationRudiId)
  log.d(mod, fun, `${msg.organizationDeleted(organizationRudiId)}`)

  return deletedOrganization
}

//---------------------------------------- 
// - Contacts
//---------------------------------------- 

exports.getContactWithRudiId = async (contactRudiId) => {
  const fun = `getContactWithRudiId`
  log.d(mod, fun, ``)
  return this.getObjectWithRudiId(Contact, API_CONTACT_ID, contactRudiId)
}

exports.getEnsuredContactWithRudiId = async (contactRudiId) => {
  const fun = `getEnsuredContactWithRudiId`
  log.d(mod, fun, ``)
  return this.getEnsuredObjectWithRudiId(URL_OBJECT_CONTACTS, Contact, API_CONTACT_ID, contactRudiId)
}

exports.getContactWithJson = async (contactJson) => {
  const fun = `getContactWithJson`
  log.d(mod, fun, ``)
  return this.getObjectWithJson(Contact, API_CONTACT_ID, contactJson)
}

exports.getEnsuredContactWithJson = async (contactJson) => {
  const fun = `getEnsuredContactWithJson`
  log.d(mod, fun, ``)
  return this.getEnsuredObjectWithJson(URL_OBJECT_CONTACTS, Contact, API_CONTACT_ID, contactJson)
}

exports.getContactWithDbId = async (contactDbId) => {
  const fun = `getContactWithDbId`
  log.d(mod, fun, ``)
  return this.getObjectWithDbId(Contact, contactDbId)
}

exports.getEnsuredContactWithDbId = async (contactDbId) => {
  const fun = `getEnsuredContactWithDbId`
  log.d(mod, fun, ``)
  return this.getEnsuredObjectWithDbId(URL_OBJECT_CONTACTS, Contact, contactDbId)
}

exports.getContactDbIdWithJson = async (contactJson) => {
  const fun = `getContactDbIdWithJson`
  log.d(mod, fun, ``)
  return this.getDbIdWithJson(URL_OBJECT_CONTACTS, Contact, API_CONTACT_ID, contactJson)
}

exports.getEnsuredContactDbIdWithJson = async (contactJson) => {
  const fun = `getEnsuredContactDbIdWithJson`
  log.d(mod, fun, ``)
  return this.getEnsuredDbIdWithJson(URL_OBJECT_CONTACTS, Contact, API_CONTACT_ID, contactJson)
}

exports.getAllContacts = async () => {
  const fun = `getAllContacts`
  log.d(mod, fun, ``)

  const contactList = await Contact.find({})

  return contactList
}

exports.updateContact = async (jsonContact) => {
  const fun = `updateContact`
  log.d(mod, fun, ``)

  // Checking incoming data for an id
  const rudiId = json.accessProperty(jsonContact, API_CONTACT_ID)

  // Checking that the contact already exists
  this.getEnsuredContactWithRudiId(rudiId)

  // Updating the contact
  const updatedcontact = await this.updateObject(Contact, API_CONTACT_ID, jsonContact)
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
  const deletedContact = await this.deleteObject(Contact, API_CONTACT_ID, contactRudiId)
  log.d(mod, fun, `${msg.contactDeleted(contactRudiId)}`)

  return deletedContact
}

//---------------------------------------- 
// - Media
//---------------------------------------- 
exports.getMediaDbIdWithJson = async (mediaJson) => {
  const fun = `getMediaDbIdWithJson`
  log.d(mod, fun, ``)
  // log.d(mod, fun, `URL_OBJECT_MEDIA: ${URL_OBJECT_MEDIA}`)
  // log.d(mod, fun, `API_MEDIA_ID: ${API_MEDIA_ID}`)
  // log.d(mod, fun, `mediaJson: ${json.beautify(mediaJson)}`)
  // log.d(mod, fun, `media dbType: ${json.beautify(mediaJson[API_MEDIA_TYPE_PROPERTY])}`)
  return this.getDbIdWithJson(URL_OBJECT_MEDIA, Media, API_MEDIA_ID, mediaJson)
}

exports.getEnsuredMediaDbIdWithJson = async (mediaJson) => {
  const fun = `getEnsuredMediaDbIdWithJson`
  log.d(mod, fun, ``)
  // log.d(mod, fun, `URL_OBJECT_MEDIA: ${URL_OBJECT_MEDIA}`)
  // log.d(mod, fun, `API_MEDIA_ID: ${API_MEDIA_ID}`)
  // log.d(mod, fun, `mediaJson: ${json.beautify(mediaJson)}`)
  // log.d(mod, fun, `media dbType: ${json.beautify(mediaJson[API_MEDIA_TYPE_PROPERTY])}`)
  return this.getEnsuredDbIdWithJson(URL_OBJECT_MEDIA, Media, API_MEDIA_ID, mediaJson)
}

exports.getMediaWithDbId = async (mediaDbId) => {
  const fun = `getMediaWithDbId`
  log.d(mod, fun, ``)
  return this.getObjectWithDbId(URL_OBJECT_MEDIA, Media, mediaDbId)
}

exports.getEnsuredMediaWithDbId = async (mediaDbId) => {
  const fun = `getEnsuredMediaWithDbId`
  log.d(mod, fun, ``)
  return this.getEnsuredObjectWithDbId(URL_OBJECT_MEDIA, Media, mediaDbId)
}

//---------------------------------------- 
// - SKOS: Scheme
//---------------------------------------- 
exports.getSchemeDbIdWithJson = async (schemeJson) => {
  const fun = `getSchemeDbIdWithJson`
  log.d(mod, fun, ``)
  return this.getDbIdWithJson(URL_OBJECT_SKOS_SCHEME, SkosScheme, API_SKOS_SCHEME_ID, schemeJson)
}

exports.getSchemeDbIdWithRudiId = async (schemeRudiId) => {
  const fun = `getSchemeDbIdWithRudiId`
  log.d(mod, fun, ``)
  return this.getDbIdWithRudiId(URL_OBJECT_SKOS_SCHEME, SkosScheme, API_SKOS_SCHEME_ID, schemeRudiId)
}

exports.getEnsuredSchemeDbIdWithRudiId = async (schemeRudiId) => {
  const fun = `getEnsuredSchemeDbIdWithRudiId`
  log.d(mod, fun, ``)
  return this.getEnsuredDbIdWithRudiId(URL_OBJECT_SKOS_SCHEME, SkosScheme, API_SKOS_SCHEME_ID, schemeRudiId)
}

exports.getSchemeRudiIdWithDbId = async (schemeDbId) => {
  const fun = `getEnsuredSchemeDbIdWithRudiId`
  log.d(mod, fun, ``)
  return this.getObjectPropertyWithDbId(SkosScheme, schemeDbId, API_SKOS_SCHEME_ID)
}

exports.getSchemeWithDbId = async (schemeDbId) => {
  const fun = `getSchemeWithDbId`
  log.d(mod, fun, ``)
  return this.getObjectWithDbId(SkosScheme, schemeDbId)
}

exports.getEnsuredSchemeWithDbId = async (schemeDbId) => {
  const fun = `getSchemeJsonIdWithDbId`
  log.d(mod, fun, ``)
  return this.getEnsuredObjectWithDbId(URL_OBJECT_SKOS_SCHEME, SkosScheme, schemeDbId)
}

exports.getEnsuredSchemeWithCode = async (schemeCode) => {
  const fun = `getSchemeJsonIdWithDbId`
  log.d(mod, fun, ``)
  return this.getEnsuredObjectWithRudiId(URL_OBJECT_SKOS_SCHEME, SkosScheme, schemeDbId)
}

//---------------------------------------- 
// - SKOS: Concept
//---------------------------------------- 

exports.getConceptWithDbId = async (conceptDbId) => {
  const fun = `getConceptWithDbId`
  log.d(mod, fun, ``)
  return this.getObjectWithDbId(SkosConcept, conceptDbId)
}

exports.getConceptRudiIdWithDbId = async (conceptDbId) => {
  const fun = `getConceptRudiIdWithDbId`
  log.d(mod, fun, ``)
  return this.getObjectPropertyWithDbId(SkosConcept, conceptDbId, API_SKOS_CONCEPT_ID)
}

exports.getConceptWithJson = async (conceptJson) => {
  const fun = `getConceptWithJson`
  log.d(mod, fun, ``)
  return this.getObjectWithJson(SkosConcept, API_SKOS_CONCEPT_ID, conceptJson)
}

exports.getConceptDbIdWithJson = async (conceptJson) => {
  const fun = `getConceptDbIdWithJson`
  log.d(mod, fun, ``)
  return this.getDbIdWithJson(URL_OBJECT_SKOS_CONCEPT, SkosConcept, API_SKOS_CONCEPT_ID, conceptJson)
}

exports.getConceptDbIdWithRudiId = async (conceptRudiId) => {
  const fun = `getConceptDbIdWithRudiId`
  log.d(mod, fun, ``)
  return this.getDbIdWithRudiId(URL_OBJECT_SKOS_CONCEPT, SkosConcept, API_SKOS_CONCEPT_ID, conceptRudiId)
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

  const conceptList = await SkosConcept.find({[API_SKOS_SCHEME_CODE]:schemeCode})
  return conceptList
}

exports.getAllConceptsWithRole = async (conceptRole) => {
  const fun = `getAllConceptsWithRole`
  log.d(mod, fun, ``)

  const conceptList = await SkosConcept.find({[API_SKOS_CONCEPT_ROLE]:conceptRole})
  return conceptList
}

//---------------------------------------- 
// - Filters
//---------------------------------------- 

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