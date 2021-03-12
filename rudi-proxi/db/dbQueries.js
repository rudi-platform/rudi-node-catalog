'use strict';
const mod = 'db'
/*
 * In this file are made the different calls to the database
 */

//———————————————————————————————————————————————————————————————
// External dependancies 
//———————————————————————————————————————————————————————————————
const boom = require('@hapi/boom')
const mongoose = require('mongoose')

//———————————————————————————————————————————————————————————————
// Internal dependencies
//———————————————————————————————————————————————————————————————
const log = require('../utils/logging')
const msg = require('../utils/msg')

const json = require('../utils/jsonAccess')

//———————————————————————————————————————————————————————————————
// Constants
//———————————————————————————————————————————————————————————————
const {
  PARAM_ID,
  URL_OBJECT_METADATA,
  URL_OBJECT_ORGANIZATIONS,
  URL_OBJECT_CONTACTS,
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
  API_REPORT_ID,
  API_RESOURCE_ID,
  API_DATA_PRODUCER_PROPERTY,
  API_DATA_CONTACTS_PROPERTY
} = require('./dbFields')

//———————————————————————————————————————————————————————————————
// Data models
//———————————————————————————————————————————————————————————————
const Metadata = require('../definitions/models/Metadata')
const Organization = require('../definitions/models/Organization')
const Contact = require('../definitions/models/Contact')



//———————————————————————————————————————————————————————————————
// Actions on DB tables
//———————————————————————————————————————————————————————————————
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
    throw boom.boomify(err)
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
    throw boom.boomify(err)
  }
}
//———————————————————————————————————————————————————————————————
// Generic functions
//———————————————————————————————————————————————————————————————
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
    throw boom.boomify(err)
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
    throw boom.boomify(err)
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
    log.d(mod, fun, `${rudiId} -> ${json.beautify(dbObject)}\n`)

    return dbObject
  } catch (err) {
    log.e(mod, fun, err)
    throw boom.boomify(err)
  }
}

exports.getEnsuredObjectWithRudiId = async (objectType, Model, idField, rudiId) => {
  const fun = `getEnsuredObjectWithRudiId`
  log.d(mod, fun, ``)

  if (!rudiId) throw new Error(`${msg.parameterExpected(fun, PARAM_ID)}`)
  else log.d(mod, fun, `RUDI id: ${rudiId}`)
  const dbObject = await this.getObjectWithRudiId(Model, idField, rudiId)
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
    throw boom.boomify(err)
  }
}

exports.getEnsuredObjectWithJson = async (objectType, Model, idField, rudiObject) => {
  const fun = `getEnsuredObjectWithJson`
  log.d(mod, fun, ``)
  try {
    const rudiId = json.accessProperty(rudiObject, idField)
    const dbObject = await this.getObjectWithRudiId(Model, idField, rudiId)
    if (!dbObject) throw new Error(`${msg.objectNotFound(objectType, rudiId)}`)
    return dbObject
  } catch (err) {
    log.e(mod, fun, err)
    throw boom.boomify(err)
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
    throw boom.boomify(err)
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
    throw boom.boomify(err)
  }
}

exports.doesObjectExistWithRudiId = async (Model, idField, rudiId) => {
  const fun = `doesObjectExistWithRudiId`
  log.d(mod, fun, ``)
  try {
    const dbObject = await this.getObjectWithRudiId(Model, idField, rudiId)
    return (!!dbObject)
  } catch (err) {
    log.e(mod, fun, err)
    throw boom.boomify(err)
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
    throw boom.boomify(err)
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
    throw boom.boomify(err)
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
    throw boom.boomify(err)
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
    throw boom.boomify(err)
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

  try {
    /* beautify ignore:start */
    let deletionInfo = await Model.findOneAndRemove({[idField]: id})
    /* beautify ignore:end */
    return deletionInfo
  } catch (err) {
    log.e(mod, fun, err)
    throw boom.boomify(err)
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
    throw boom.boomify(err)
  }
}

exports.deleteMany = async (Model, conditions) => {
  const fun = `deleteMany`
  // log.d(mod, fun, `conditions: ${conditions}`)

  // TODO: to be consolidated!
  if (typeof (conditions) == 'string')
    conditions = changeConditionsIntoRegex(conditions)

  try {
    let deletionInfo = await Model.deleteMany(conditions)
    return deletionInfo
  } catch (err) {
    log.e(mod, fun, err)
    throw boom.boomify(err)
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

//———————————————————————————————————————————————————————————————
// Specific functions
//———————————————————————————————————————————————————————————————

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
  return this.getEnsuredObjectWithJson(Metadata, API_METADATA_ID, metadataJson)
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

exports.getEnsuredContactDbIdWithJson = async (contactDbId) => {
  const fun = `getEnsuredContactDbIdWithJson`
  log.d(mod, fun, ``)
  return this.getEnsuredDbIdWithJson(URL_OBJECT_CONTACTS, Contact, API_CONTACT_ID, contactDbId)
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