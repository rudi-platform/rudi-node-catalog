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
  REQ_ID
} = require('../routes/apiUrl')

// Fields from the JSON as definied in the API
const {
  DB_ID,
  API_METADATA_ID,
  API_ORGANIZATION_ID,
  API_CONTACT_ID,
  API_PRODUCER_PROPERTY,
  API_CONTACTS_PROPERTY
} = require('../db/dbFields')

//———————————————————————————————————————————————————————————————
// Data models
//———————————————————————————————————————————————————————————————
const Metadata = require('../definitions/models/Metadata')
const Organization = require('../definitions/models/Organization')
const Contact = require('../definitions/models/Contact')


//———————————————————————————————————————————————————————————————
// Factorized functions
//———————————————————————————————————————————————————————————————
exports.getInfoFromRudiId = async (dbModel, labelIdField, rudiId) => {
  const fun = 'getInfoFromRudiId'
  log.d(fun, ``)

  let fullInfo = ''
  try {

    if (!rudiId || '' == rudiId) {
      throw new Error(`${msg.parameterExpected(fun, REQ_ID)}`)
    } else {
      log.d(fun, `RUDI id: ${rudiId}`)
    }

    fullInfo = await dbModel.findOne({
      [labelIdField]: rudiId
    })
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
  /* 
    if (!fullInfo || '' == fullInfo) {
      throw new Error(`Object not found for ${labelIdField}: ${rudiId}`)
    }
  */
  log.d(fun, `full info: ${fullInfo}`)
  return fullInfo
}

exports.getInfoFromJson = async (dbModel, labelIdField, jsonObject) => {
  const fun = 'getInfoFromJson'
  log.d(fun, ``)

  let fullInfo = ''

  const id = jsonObject[labelIdField]
  if (!id || '' == id) {
    throw new Error(`${msg.missingProperty(jsonObject, labelIdField)}`)
  }

  return this.getInfoFromRudiId(dbModel, labelIdField, id)
  // log.d(fun, `full info: ${fullInfo}`)
}


exports.getInfoFromDbId = async (dbModel, id) => {
  const fun = 'getInfoFromDbId'

  /* beautify ignore:start */
  return dbModel.findOne({[DB_ID]: id})
  /* beautify ignore:end */
}

exports.updateInfo = async (dbModel, labelIdField, jsonUpdateData) => {
  const fun = 'updateInfo'
  log.d(fun, ``)

  const id = jsonUpdateData[labelIdField]
  if (!id || '' == id) {
    throw new Error(`${msg.missingProperty(jsonUpdateData, labelIdField)}`)
  }

  let fullInfo = ''
  try {
    fullInfo = await dbModel.findOneAndUpdate({
      [labelIdField]: jsonUpdateData[labelIdField]
    }, jsonUpdateData, {
      new: true
    })
    return fullInfo
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
  /* 
    if ('' == fullInfo) {
      throw new Error(`Object doesn't exist with ${labelIdField}: ${id}`)
    }
   */
  log.d(fun, `full info: ${fullInfo}`)
  return fullInfo
}

exports.deleteInfo = async (dbModel, labelIdField, id) => {
  const fun = 'deleteInfo'
  log.d(fun, ``)

  if (!id || '' == id) {
    throw new Error(`${msg.parameterExpected(fun, labelIdField)}`)
  }

  try {
    let deletedInfo = await dbModel.findOneAndRemove({
      [labelIdField]: id
    })
    return deletedInfo
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
  /* 
    if ('' == fullInfo) {
      throw new Error(`Object doesn't exist with ${labelIdField}: ${id}`)
    }
   */
  // log.d(fun, `full info: ${fullInfo}`)
  return fullInfo
}

//———————————————————————————————————————————————————————————————
// Access to specific fields
//———————————————————————————————————————————————————————————————

//---------------------------------------- 
// - Metadata
//---------------------------------------- 
exports.getMetadataFromJson = async (metadataJson) => {
  const fun = 'getMetadataFromJson'
  log.d(fun, ``)
  return this.getInfoFromJson(Metadata, API_METADATA_ID, metadataJson)
}

exports.getMetadataFromRudiId = async (rudiId) => {
  const fun = 'getMetadataFromRudiId'
  log.d(fun, ``)
  return this.getInfoFromRudiId(Metadata, API_METADATA_ID, rudiId)
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
  if (!id || '' == id) {
    throw new Error(`${msg.missingProperty(jsonMetadata, API_METADATA_ID)}`)
  }

  // Checking that the metadata already exists
  const existingMetadata = await this.getMetadataFromRudiId(id)
  if (!existingMetadata || '' == existingMetadata) {
    throw new Error(`${msg.metadataNotFound(id)}`)
  }

  // Updating the organization
  const updatedMetadata = await this.updateInfo(Metadata, API_METADATA_ID, jsonMetadata)

  return updatedMetadata
}

//---------------------------------------- 
// - Organization
//---------------------------------------- 
exports.getOrganizationFromJson = async (organizationJson) => {
  const fun = 'getOrganizationFromJson'
  log.d(fun, ``)
  return this.getInfoFromJson(Organization, API_ORGANIZATION_ID, organizationJson)
}

exports.getOrganizationFromRudiId = async (rudiId) => {
  const fun = 'getMetadataFromRudiId'
  log.d(fun, ``)
  return this.getInfoFromRudiId(Organization, API_ORGANIZATION_ID, rudiId)
}

exports.getOrganizationFromDbId = async (id) => {
  const fun = 'getOrganizationFromId'
  log.d(fun, ``)
  return this.getInfoFromDbId(Organization, id)
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
  if (!id || '' == id) {
    throw new Error(`${msg.missingProperty(jsonOrganization, API_ORGANIZATION_ID)}`)
  }

  // Checking that the organization already exists
  const existingOrganization = await this.getOrganizationFromRudiId(id)
  if (!existingOrganization || '' == existingOrganization) {
    throw new Error(`${msg.organizationNotFound(id)}`)
  }

  // Updating the organization
  const updatedOrganization = await this.updateInfo(Organization, API_ORGANIZATION_ID, jsonOrganization)
  log.d(fun, `${msg.organizationUpdated(id)}`)

  return updatedOrganization
}

exports.deleteOrganization = async (organizationRudiId) => {
  const fun = 'deleteOrganization'
  log.d(fun, ``)

  // Checking the id parameter
  if (!organizationRudiId || '' == organizationRudiId) {
    throw new Error(`${msg.parameterExpected(fun, API_ORGANIZATION_ID)}`)
  }

  // Checking that the organization already exists
  const existingOrganization = await this.getOrganizationFromRudiId(organizationRudiId)
  if (!existingOrganization || '' == existingOrganization) {
    throw new Error(`${msg.organizationNotFound(organizationRudiId)}`)
  }

  // Deleting the organization
  const deletedOrganization = await this.deleteInfo(Organization, API_ORGANIZATION_ID, organizationRudiId)
  log.d(fun, `${msg.organizationDeleted(organizationRudiId)}`)

  return deletedOrganization
}

//---------------------------------------- 
// - Contacts
//---------------------------------------- 
exports.getContactFromRudiId = async (contactRudiId) => {
  const fun = 'getContactFromRudiId'
  log.d(fun, ``)
  return this.getInfoFromRudiId(Contact, API_CONTACT_ID, contactRudiId)
}

exports.getContactFromJson = async (contactJson) => {
  const fun = 'getContactFromJson'
  log.d(fun, ``)
  return this.getInfoFromJson(Contact, API_CONTACT_ID, contactJson)
}

exports.getContactFromDbId = async (id) => {
  const fun = 'getContactFromDbId'
  log.d(fun, ``)
  return this.getInfoFromDbId(Contact, id)
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
  const id = json.accessProperty(jsonContact, API_CONTACT_ID)

  // Checking that the contact already exists
  const existingContact = await this.getContactFromRudiId(id)
  if (!existingContact || '' == existingContact) {
    throw new Error(`${msg.contactNotFound(id)}`)
  }

  // Updating the contact
  const updatedcontact = await this.updateInfo(Contact, API_CONTACT_ID, jsonContact)
  log.d(fun, `${msg.contactUpdated(id)}`)

  return updatedcontact
}


exports.deleteContact = async (contactRudiId) => {
  const fun = 'deleteContact'
  log.d(fun, ``)

  // Checking the id parameter
  if (!contactRudiId || '' == contactRudiId) {
    throw new Error(`${msg.parameterExpected(fun, API_CONTACT_ID)}`)
  }

  // Checking that the contact already exists
  const existingContact = await this.getContactFromRudiId(contactRudiId)
  if (!existingContact || '' == existingContact) {
    throw new Error(`${msg.contactNotFound(contactRudiId)}`)
  }

  // Deleting the contact
  const deletedContact = await this.deleteInfo(Contact, API_CONTACT_ID, contactRudiId)
  log.d(fun, `${msg.contactDeleted(contactRudiId)}`)

  return deletedContact
}