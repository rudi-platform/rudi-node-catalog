//———————————————————————————————————————————————————————————————
// External dependancies 
//———————————————————————————————————————————————————————————————
const boom = require('@hapi/boom')

//———————————————————————————————————————————————————————————————
// Internal dependancies 
//———————————————————————————————————————————————————————————————
const log = require('../utils/logging')
const msg = require('../utils/msg')
const lang = require('../utils/lang')

const db = require('../db/dbQueries')
const json = require('../utils/jsonAccess')

//———————————————————————————————————————————————————————————————
// Constants
//———————————————————————————————————————————————————————————————
const {
  DB_ID,
  API_METADATA_ID,
  API_ORGANIZATION_ID,
  API_CONTACT_ID,
  API_PRODUCER_PROPERTY,
  API_CONTACTS_PROPERTY
} = require('../db/dbFields')

const {
  REQ_LANG,
  REQ_ID
} = require('../routes/apiUrl')

//———————————————————————————————————————————————————————————————
// Data models
//———————————————————————————————————————————————————————————————
const Metadata = require('../definitions/models/Metadata')
const Organization = require('../definitions/models/Organization')
const Contact = require('../definitions/models/Contact')

//———————————————————————————————————————————————————————————————
// Helper functions
//———————————————————————————————————————————————————————————————

exports.updateJsonOrganization = async (organizationJson) => {
  const fun = 'updateJsonOrganization'
  // log.d(fun, `organizationJson: ${organizationJson}`)

  // Retrieveing full info for the organization
  const id = json.accessProperty(organizationJson, API_ORGANIZATION_ID)
  const organizationInfo = await db.getOrganizationFromJson(organizationJson)

  // TODO[VALIDATE]: we assume the organization has previously been created!
  if (!organizationInfo || '' == organizationInfo) {
    throw new Error(`${msg.organizationNotFound(id)}`)
  }

  return organizationInfo
}

exports.updateJsonContact = async (contactJson) => {
  const fun = 'updateJsonContact'
  log.d(fun, ``)

  const contactRudiId = json.accessProperty(contactJson, API_CONTACT_ID)
  const updatedContact = await db.getContactFromRudiId(contactRudiId)

  // TODO[VALIDATE]: we assume the contact has previously been created!
  if (!updatedContact || '' == updatedContact) {
    throw new Error(`${msg.contactNotFound(contactRudiId)}`)
  }
  return updatedContact
}

exports.updateJsonContactList = async (contactsJson) => {
  const fun = 'updateContactListJson'
  log.d(fun, ``)

  // Retrieveing full info for the contacts
  let fullContacts = []
  for (const contact of contactsJson) {
    fullContacts.push(await this.updateJsonContact(contact))
  }

  return fullContacts
}

exports.updateMetadataPropertiesFromDb = async (metadata) => {
  const fun = 'updateMetadataProperties'
  log.d(fun, `metadata: ${metadata}`)

  /* beautify ignore:start */
  // TODO: clone the metadata (to avoid mutating an external object)
  let updatedMetadata = metadata;
  /* beautify ignore:end */

  //————— Updating Producer info
  // Note : here we are updating data as they are stored in DB
  //        So 'producer' field is in reality a producer mongo _id!
  const producerId = json.accessProperty(metadata, API_PRODUCER_PROPERTY)
  const updatedProducer = await db.getOrganizationFromDbId(producerId)
  if ('' == updatedProducer) {
    throw new Error(`${msg.organizationNotFound(producerId)}`)
  }

  //————— Updating Contacts info
  // Note : here we are updating data as they are stored in DB
  //        So 'contacts' field is actually an array of contact mongo _ids!
  const contacts = json.accessProperty(metadata, API_CONTACTS_PROPERTY)

  let updatedContacts = []
  for (const contactId of contacts) {
    // const contactId = contact[API_CONTACT_ID]

    const updatedContact = await db.getContactFromDbId(contactId)
    if ('' == updatedContact) {
      throw new Error(`${msg.contactNotFound(producerId)}`)
    }
    updatedContacts.push(updatedContact)
  }

  updatedMetadata[API_PRODUCER_PROPERTY] = updatedProducer
  updatedMetadata[API_CONTACTS_PROPERTY] = updatedContacts

  return updatedMetadata
}

exports.updateMetadataListPropertiesFromDb = async (metadataList) => {
  const fun = 'updateMetadataListPropertiesFromDb'
  // log.d(fun, `metadataList: ${metadataList}`)

  let producerCache = new Map()
  let contactCache = new Map()
  let updatedMetadataList = []

  for (const metadata of metadataList) {
    // log.d(fun, `metadata: ${metadata}`)

    /* beautify ignore:start */
    let updatedMetadata = metadata;
    /* beautify ignore:end */
    // log.d(fun, `metadata clone: ${updatedMetadata}`)

    //————— Updating Producer info
    // Note : here we are updating data as they are stored in DB
    //        So 'producer' field is in reality a producer mongo _id!
    const producerId = metadata[API_PRODUCER_PROPERTY]

    let updatedProducer = producerCache.get(producerId)
    if (!updatedProducer) {
      updatedProducer = await db.getOrganizationFromDbId(producerId)
      if ('' == updatedProducer) {
        throw new Error(`${msg.organizationNotFound(producerId)}`)
      }

      producerCache.set(producerId, updatedProducer)
    }

    //————— Updating Contacts info
    // Note : here we are updating data as they are stored in DB
    //        So 'contacts' field is actually an array of contact mongo _ids!
    const contacts = metadata[API_CONTACTS_PROPERTY]

    let updatedContacts = []
    for (const contactId of contacts) {
      // const contactId = contact[API_CONTACT_ID]

      let updatedContact = contactCache.get(contactId)
      if (!updatedContact) {
        updatedContact = await db.getContactFromDbId(contactId)
        if ('' == updatedContact) {
          throw new Error(`${msg.contactNotFound(producerId)}`)
        }
        contactCache.set(contactId, updatedContact)
      }

      updatedContacts.push(updatedContact)
    }

    updatedMetadata[API_PRODUCER_PROPERTY] = updatedProducer
    updatedMetadata[API_CONTACTS_PROPERTY] = updatedContacts
    updatedMetadataList.push(updatedMetadata)
    // log.d(fun, `updatedMetadata: ${updatedMetadata}`)
  }

  return updatedMetadataList
}