/*
 * In this file are made the different calls to the database
 */

//———————————————————————————————————————————————————————————————
// External dependancies 
//———————————————————————————————————————————————————————————————
const boom = require('@hapi/boom')

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

// Fields from the JSON as definied in the API
const {
  DB_ID,
  API_METADATA_ID,
  API_ORGANIZATION_ID,
  API_CONTACT_ID,
  API_REPORT_ID,
  API_RESOURCE_ID,
  API_PRODUCER_PROPERTY,
  API_CONTACTS_PROPERTY
} = require('./dbFields')

//———————————————————————————————————————————————————————————————
// Data models
//———————————————————————————————————————————————————————————————
const Metadata = require('../definitions/models/Metadata')
const Organization = require('../definitions/models/Organization')
const Contact = require('../definitions/models/Contact')



//———————————————————————————————————————————————————————————————
// Generic functions
//———————————————————————————————————————————————————————————————
exports.getEnsuredDbIdWithRudiId = async (objectType, Model, idField, rudiId) => {
  const fun = 'getDbIdWithRudiId'
  log.d(fun, ``)
  // log.d(fun, `objectType: ${objectType}`)
  // log.d(fun, `idField: ${idField}`)
  // log.d(fun, `rudiId: ${rudiId}`)
  try {
    /* beautify ignore:start */
    const dbObject = await Model.findOne({[idField]: rudiId})
    /* beautify ignore:end */
    if (!dbObject) throw new Error(`${msg.objectNotFound(objectType, rudiId)}`)
    const dbId = json.accessProperty(dbObject, DB_ID)
    return dbId
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

exports.getEnsuredDbIdWithJson = async (objectType, Model, idField, rudiObject) => {
  const fun = 'getDbIdWithJson'
  log.d(fun, ``)
  // log.d(fun, `objectType: ${objectType}`)
  // log.d(fun, `idField: ${idField}`)
  // log.d(fun, `jsonObject: ${JSON.stringify(jsonObject)}`)
  try {
    const rudiId = json.accessProperty(rudiObject, idField)
    return await this.getEnsuredDbIdWithRudiId(objectType, Model, idField, rudiId)
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

exports.getObjectWithRudiId = async (Model, idField, rudiId) => {
  const fun = 'getObjectWithRudiId'
  log.d(fun, ``)
  try {
    if (!rudiId) throw new Error(`${msg.parameterExpected(fun, PARAM_ID)}`)
    log.d(fun, `RUDI id: ${rudiId}`)
    /* beautify ignore:start */
    const dbObject = await Model.findOne({[idField]: rudiId})
    /* beautify ignore:end */
    return dbObject
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

exports.getEnsuredObjectWithRudiId = async (objectType, Model, idField, rudiId) => {
  const fun = 'getEnsuredObjectWithRudiId'
  log.d(fun, ``)
  try {
    if (!rudiId) throw new Error(`${msg.parameterExpected(fun, PARAM_ID)}`)
    else log.d(fun, `RUDI id: ${rudiId}`)
    const dbObject = await this.getObjectWithRudiId(Model, idField, rudiId)
    if (!dbObject) throw new Error(`${msg.objectNotFound(objectType, rudiId)}`)
    return dbObject
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

exports.getObjectWithJson = async (Model, idField, rudiObject) => {
  const fun = 'getObjectWithJson'
  log.d(fun, ``)
  try {
    const rudiId = json.accessProperty(rudiObject, idField)
    const dbObject = await this.getObjectWithRudiId(Model, idField, rudiId)
    return dbObject
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

exports.getEnsuredObjectWithJson = async (objectType, Model, idField, rudiObject) => {
  const fun = 'getEnsuredObjectWithJson'
  log.d(fun, ``)
  try {
    const rudiId = json.accessProperty(rudiObject, idField)
    const dbObject = await this.getObjectWithRudiId(Model, idField, rudiId)
    if (!dbObject) throw new Error(`${msg.objectNotFound(objectType, rudiId)}`)
    return dbObject
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}


exports.getObjectWithDbId = async (Model, dbId) => {
  const fun = 'getObjectWithDbId'
  log.d(fun, ``)
  try {
    /* beautify ignore:start */
    const dbObject = await Model.findOne({[DB_ID]: dbId})
    /* beautify ignore:end */
    return dbObject
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

exports.getEnsuredObjectWithDbId = async (objectType, Model, dbId) => {
  const fun = 'getEnsuredObjectWithDbId'
  log.d(fun, ``)
  try {
    const dbObject = await this.getObjectWithDbId(Model, dbId)
    if (!dbObject) throw new Error(`${msg.objectNotFound(objectType, dbId)}`)
    return dbObject
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

exports.doesObjectExistWithRudiId = async (Model, idField, rudiId) => {
  const fun = 'doesObjectExistWithRudiId'
  log.d(fun, ``)
  try {
    const existingInfo = await this.getObjectWithRudiId(Model, idField, rudiId)
    return (!!existingInfo)
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

exports.doesObjectExistWithJson = async (Model, idField, rudiObject) => {
  const fun = 'doesObjectExistWithJson'
  log.d(fun, ``)
  try {
    const dbObject = await this.getObjectWithJson(Model, idField, rudiObject)
    return (!!dbObject)
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

exports.getObjectList = async (Model, limit, offset) => {
  const fun = 'getObjectList'
  log.d(fun, ``)
  // log.d(fun, `filter.limit: ${filter.limit}, filter.offset: ${filter.skip}`)
  try {
    const objectList = await Model.find({}).limit(limit).skip(offset)
    return objectList
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

exports.updateObject = async (Model, idField, jsonUpdateData) => {
  const fun = 'updateObject'
  log.d(fun, ``)

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
    log.e(fun, err)
    throw boom.boomify(err)
  }
  log.d(fun, `updatedObject: ${JSON.stringify(updatedObject)}`)
  return updatedObject
}

exports.deleteObject = async (Model, idField, id) => {
  const fun = 'deleteObject'
  log.d(fun, ``)
  if (!id) {
    throw new Error(`${msg.parameterExpected(fun, idField)}`)
  }

  try {
    /* beautify ignore:start */
    let deletionInfo = await Model.findOneAndRemove({[idField]: id})
    /* beautify ignore:end */
    return deletionInfo
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
  return fullInfo
}

exports.deleteAll = async (Model) => {
  const fun = 'deleteAll'
  // log.d(fun, `Model: ${Model}`)

  try {
    let deletionInfo = await Model.deleteMany()
    return deletionInfo
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

exports.deleteMany = async (Model, conditions) => {
  const fun = 'deleteMany'
  // log.d(fun, `conditions: ${conditions}`)

  // TODO: to be consolidated!
  if (typeof (conditions) == 'string')
    conditions = changeConditionsIntoRegex(conditions)

  try {
    let deletionInfo = await Model.deleteMany(conditions)
    return deletionInfo
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

function changeConditionsIntoRegex(conditions) {
  const fun = 'changeConditionsIntoRegex'

  let regexConditions = {}
  Object.keys(conditions).forEach(key => {
    let regexp = new RegExp(conditions[key])
    log.d(fun, regexp)
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
exports.getMetadataFromJson = async (metadataJson) => {
  const fun = 'getMetadataFromJson'
  log.d(fun, ``)
  return this.getObjectWithJson(Metadata, API_METADATA_ID, metadataJson)
}

exports.getMetadataFromRudiId = async (rudiId) => {
  const fun = 'getMetadataFromRudiId'
  log.d(fun, ``)
  return this.getObjectWithRudiId(Metadata, API_METADATA_ID, rudiId)
}

exports.getAllMetadata = async () => {
  const fun = 'getAllMetadata'
  log.d(fun, ``)

  const metadataList = await Metadata.find({})
  // log.d(fun, `metadataList: ${metadataList}`)

  return metadataList
}

exports.updateMetadata = async (jsonMetadata) => {
  const fun = 'updateMetadata'
  log.d(fun, ``)

  // Checking incoming data for an id
  const id = jsonMetadata[API_METADATA_ID]
  if (!id) {
    throw new Error(`${msg.missingProperty(jsonMetadata, API_METADATA_ID)}`)
  }

  // Checking that the metadata already exists
  const existingMetadata = await this.getMetadataFromRudiId(id)
  if (!existingMetadata) {
    throw new Error(`${msg.metadataNotFound(id)}`)
  }

  // Updating the organization
  const updatedMetadata = await this.updateObject(Metadata, API_METADATA_ID, jsonMetadata)

  return updatedMetadata
}


exports.deleteMetadata = async (metadataRudiId) => {
  const fun = 'deleteOrganization'
  log.d(fun, ``)

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
  log.d(fun, `${msg.organizationDeleted(metadataRudiId)}`)

  return deletedOrganization
}
//---------------------------------------- 
// - Organization
//---------------------------------------- 
exports.getOrganizationWithJson = async (organizationJson) => {
  const fun = 'getOrganizationWithJson'
  log.d(fun, ``)
  return this.getObjectWithJson(Organization, API_ORGANIZATION_ID, organizationJson)
}
exports.getEnsuredOrganizationWithJson = async (organizationJson) => {
  const fun = 'getEnsuredOrganizationWithJson'
  log.d(fun, ``)
  const rudiId = json.accessProperty(organizationJson, API_ORGANIZATION_ID)
  return this.getEnsuredOrganizationWithRudiId(rudiId)
}

exports.getOrganizationWithRudiId = async (rudiId) => {
  const fun = 'getOrganizationWithRudiId'
  log.d(fun, ``)
  return this.getObjectWithRudiId(Organization, API_ORGANIZATION_ID, rudiId)
}
exports.getEnsuredOrganizationWithRudiId = async (rudiId) => {
  const fun = 'getEnsuredOrganizationWithRudiId'
  log.d(fun, ``)
  return this.getEnsuredObjectWithRudiId(URL_OBJECT_ORGANIZATIONS, Organization, API_ORGANIZATION_ID, rudiId)
}

exports.getOrganizationWithDbId = async (id) => {
  const fun = 'getOrganizationWithDbId'
  log.d(fun, ``)
  return this.getObjectWithDbId(Organization, id)
}

exports.getEnsuredOrganizationWithDbId = async (dbId) => {
  const fun = 'getOrganizationWithDbId'
  log.d(fun, ``)
  return this.getEnsuredObjectWithDbId(URL_OBJECT_ORGANIZATIONS, Organization, dbId)
}

exports.getEnsuredOrganizationDbIdWithJson = async (organizationJson) => {
  const fun = 'getEnsuredOrganizationDbIdWithJson'
  log.d(fun, ``)
  return this.getEnsuredDbIdWithJson(URL_OBJECT_ORGANIZATIONS, Organization, API_ORGANIZATION_ID, organizationJson)
}

exports.getAllOrganizations = async () => {
  const fun = 'getAllOrganizations'
  log.d(fun, ``)

  const organizationList = await Organization.find({})
  // log.d(fun, `metadataList: ${metadataList}`)

  return organizationList
}

exports.updateOrganization = async (jsonOrganization) => {
  const fun = 'updateOrganization'
  log.d(fun, ``)

  // Checking incoming data for an id
  const id = jsonOrganization[API_ORGANIZATION_ID]
  if (!id) {
    throw new Error(`${msg.missingProperty(jsonOrganization, API_ORGANIZATION_ID)}`)
  }

  // Checking that the organization already exists
  const existingOrganization = await this.getOrganizationWithRudiId(id)
  if (!existingOrganization) {
    throw new Error(`${msg.organizationNotFound(id)}`)
  }

  // Updating the organization
  const updatedOrganization = await this.updateObject(Organization, API_ORGANIZATION_ID, jsonOrganization)
  log.d(fun, `${msg.organizationUpdated(id)}`)

  return updatedOrganization
}

exports.deleteOrganization = async (organizationRudiId) => {
  const fun = 'deleteOrganization'
  log.d(fun, ``)

  // Checking the id parameter
  if (!organizationRudiId) {
    throw new Error(`${msg.parameterExpected(fun, API_ORGANIZATION_ID)}`)
  }

  // Checking that the organization already exists
  const existingOrganization = await this.getEnsuredOrganizationWithRudiId(organizationRudiId)

  // Deleting the organization
  const deletedOrganization = await this.deleteObject(Organization, API_ORGANIZATION_ID, organizationRudiId)
  log.d(fun, `${msg.organizationDeleted(organizationRudiId)}`)

  return deletedOrganization
}

//---------------------------------------- 
// - Contacts
//---------------------------------------- 
exports.getContactWithRudiId = async (contactRudiId) => {
  const fun = 'getContactWithRudiId'
  log.d(fun, ``)
  return this.getObjectWithRudiId(Contact, API_CONTACT_ID, contactRudiId)
}

exports.getEnsuredContactWithRudiId = async (contactRudiId) => {
  const fun = 'getEnsuredContactWithRudiId'
  log.d(fun, ``)
  return this.getEnsuredObjectWithRudiId(URL_OBJECT_CONTACTS, Contact, API_CONTACT_ID, contactRudiId)
}

exports.getContactWithJson = async (contactJson) => {
  const fun = 'getContactWithJson'
  log.d(fun, ``)
  return this.getObjectWithJson(Contact, API_CONTACT_ID, contactJson)
}

exports.getEnsuredContactWithJson = async (contactJson) => {
  const fun = 'getEnsuredContactWithJson'
  log.d(fun, ``)
  return this.getEnsuredObjectWithJson(URL_OBJECT_CONTACTS, Contact, API_CONTACT_ID, contactJson)
}

exports.getContactWithDbId = async (contactDbId) => {
  const fun = 'getContactWithDbId'
  log.d(fun, ``)
  return this.getObjectWithDbId(Contact, contactDbId)
}

exports.getEnsuredContactWithDbId = async (contactDbId) => {
  const fun = 'getEnsuredContactWithDbId'
  log.d(fun, ``)
  return this.getEnsuredObjectWithDbId(URL_OBJECT_CONTACTS, Contact, contactDbId)
}

exports.getEnsuredContactDbIdWithJson = async (contactDbId) => {
  const fun = 'getEnsuredContactDbIdWithJson'
  log.d(fun, ``)
  return this.getEnsuredDbIdWithJson(URL_OBJECT_CONTACTS, Contact, API_CONTACT_ID, contactDbId)
}

exports.getAllContacts = async () => {
  const fun = 'getAllContacts'
  log.d(fun, ``)

  const contactList = await Contact.find({})

  return contactList
}

exports.updateContact = async (jsonContact) => {
  const fun = 'updateContact'
  log.d(fun, ``)

  // Checking incoming data for an id
  const rudiId = json.accessProperty(jsonContact, API_CONTACT_ID)

  // Checking that the contact already exists
  this.getEnsuredContactWithRudiId(rudiId)

  // Updating the contact
  const updatedcontact = await this.updateObject(Contact, API_CONTACT_ID, jsonContact)
  log.d(fun, `${msg.contactUpdated(rudiId)}`)

  return updatedcontact
}


exports.deleteContact = async (contactRudiId) => {
  const fun = 'deleteContact'
  log.d(fun, ``)

  // Checking the id parameter
  if (!contactRudiId) {
    throw new Error(`${msg.parameterExpected(fun, API_CONTACT_ID)}`)
  }

  // Checking that the contact already exists
  await this.getEnsuredContactWithRudiId(contactRudiId)

  // Deleting the contact
  const deletedContact = await this.deleteObject(Contact, API_CONTACT_ID, contactRudiId)
  log.d(fun, `${msg.contactDeleted(contactRudiId)}`)

  return deletedContact
}