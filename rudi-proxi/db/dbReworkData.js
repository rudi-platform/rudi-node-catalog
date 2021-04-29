'use strict';

const mod = 'dbRwk'
/*
 * In this file are a set of functions that rework the data 
 * - hide mongoose fields '_id' and '__v': they are not permanent
 *   so irrelevant
 * - replace attributes that link a mongoose document id by its
 *   attributes values, ie 'producer', 'contacts', and the ones 
 *   that can be found in 'metadata_info'.
 */

//---------------------------------------------------------------
// External dependancies 
//---------------------------------------------------------------
const boom = require('@hapi/boom')

//---------------------------------------------------------------
// Internal dependancies 
//---------------------------------------------------------------
const log = require('../utils/logging')
const msg = require('../utils/msg')
const lang = require('../utils/lang')

const db = require('./dbQueries')
const json = require('../utils/jsonAccess')

//---------------------------------------------------------------
// Constants
//---------------------------------------------------------------
const {
  DB_ID,
  DB_V,
  API_METADATA_ID,
  API_ORGANIZATION_ID,
  API_CONTACT_ID,
  API_DATA_PRODUCER_PROPERTY,
  API_DATA_CONTACTS_PROPERTY
} = require('./dbFields')

//---------------------------------------------------------------
// Data models
//---------------------------------------------------------------
/* beautify ignore:start */
const { Metadata } = require('../definitions/models/Metadata');
/* beautify ignore:end */
const Organization = require('../definitions/models/Organization')
const Contact = require('../definitions/models/Contact')

//---------------------------------------------------------------
// Unmongoozify functions
//---------------------------------------------------------------

exports.unmongoosify = (dbObject) => {
  const fun = 'unmongoosify'
  log.d(mod, fun, ``)
  try {
    if (!dbObject) throw new Error(`${msg.parameterExpected(fun, 'dbObject')}`)
    let cleanObject = json.deepClone(dbObject)
    delete cleanObject[DB_ID]
    delete cleanObject[DB_V]
    // log.d(mod, fun, `${dbObject}\n=>\n${json.beautify(cleanObject, 2)}`)
    return cleanObject
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}

//---------------------------------------------------------------
// Producer/contacts functions
//---------------------------------------------------------------

exports.updateJsonOrganization = async (organizationJson) => {
  const fun = 'updateJsonOrganization'
  log.d(mod, fun, `organizationJson: ${organizationJson}`)

  // Retrieveing full info for the organization
  const id = json.accessProperty(organizationJson, API_ORGANIZATION_ID)
  const organizationInfo = await db.getOrganizationWithJson(organizationJson)

  // TODO[VALIDATE]: we assume the organization has previously been created!
  if (!organizationInfo || '' == organizationInfo) {
    throw new Error(`${msg.organizationNotFound(id)}`)
  }

  return organizationInfo
}

exports.updateJsonContact = async (contactJson) => {
  const fun = 'updateJsonContact'
  log.d(mod, fun, ``)

  const contactRudiId = json.accessProperty(contactJson, API_CONTACT_ID)
  const updatedContact = await db.getContactWithRudiId(contactRudiId)

  // TODO[VALIDATE]: we assume the contact has previously been created!
  if (!updatedContact || '' == updatedContact) {
    throw new Error(`${msg.contactNotFound(contactRudiId)}`)
  }
  return updatedContact
}

exports.updateJsonContactList = async (contactsJson) => {
  const fun = 'updateContactListJson'
  log.d(mod, fun, ``)

  // Retrieveing full info for the contacts
  let fullContacts = []
  for (const contact of contactsJson) {
    fullContacts.push(await this.updateJsonContact(contact))
  }

  return fullContacts
}

exports.updateMetadataPropertiesFromDb = async (metadata) => {
  const fun = 'updateMetadataProperties'
  log.d(mod, fun, `metadata: ${metadata}`)

  /* beautify ignore:start */
  // TODO: clone the metadata (to avoid mutating an external object)
  let updatedMetadata = metadata;
  /* beautify ignore:end */

  //————— Updating Producer info
  // Note : here we are updating data as they are stored in DB
  //        So 'producer' field is in reality a producer mongo _id!
  const producerId = json.accessProperty(metadata, API_DATA_PRODUCER_PROPERTY)
  const updatedProducer = await db.getOrganizationWithDbId(producerId)
  if ('' == updatedProducer) {
    throw new Error(`${msg.organizationNotFound(producerId)}`)
  }

  //————— Updating Contacts info
  // Note : here we are updating data as they are stored in DB
  //        So 'contacts' field is actually an array of contact mongo _ids!
  const contacts = json.accessProperty(metadata, API_DATA_CONTACTS_PROPERTY)

  let updatedContacts = []
  for (const contactId of contacts) {
    // const contactId = contact[API_CONTACT_ID]

    const updatedContact = await db.getContactWithDbId(contactId)
    if ('' == updatedContact) {
      throw new Error(`${msg.contactNotFound(producerId)}`)
    }
    updatedContacts.push(updatedContact)
  }

  updatedMetadata[API_DATA_PRODUCER_PROPERTY] = updatedProducer
  updatedMetadata[API_DATA_CONTACTS_PROPERTY] = updatedContacts

  return updatedMetadata
}

exports.updateMetadataListPropertiesFromDb = async (metadataList) => {
  const fun = 'updateMetadataListPropertiesFromDb'
  // log.d(mod, fun, `metadataList: ${metadataList}`)

  // let producerCache = new Map()
  // let contactCache = new Map()
  let updatedMetadataList = []

  for (const metadata of metadataList) {
    // log.d(mod, fun, `metadata: ${metadata}`)

    /* beautify ignore:start */
    let updatedMetadata = metadata;
    /* beautify ignore:end */
    // log.d(mod, fun, `metadata clone: ${updatedMetadata}`)

    //————— Updating Producer info
    // Note : here we are updating data as they are stored in DB
    //        So 'producer' field is in reality a producer mongo _id!
    const producerId = metadata[API_DATA_PRODUCER_PROPERTY]

    // let updatedProducer = producerCache.get(producerId)
    if (!updatedProducer) {
      updatedProducer = await db.getOrganizationWithDbId(producerId)
      if ('' == updatedProducer) {
        throw new Error(`${msg.organizationNotFound(producerId)}`)
      }

      // producerCache.set(producerId, updatedProducer)
    }

    //————— Updating Contacts info
    // Note : here we are updating data as they are stored in DB
    //        So 'contacts' field is actually an array of contact mongo _ids!
    const contacts = metadata[API_DATA_CONTACTS_PROPERTY]

    let updatedContacts = []
    for (const contactId of contacts) {
      // const contactId = contact[API_CONTACT_ID]

      // let updatedContact = contactCache.get(contactId)
      if (!updatedContact) {
        updatedContact = await db.getContactWithDbId(contactId)
        if ('' == updatedContact) {
          throw new Error(`${msg.contactNotFound(producerId)}`)
        }
        // contactCache.set(contactId, updatedContact)
      }

      updatedContacts.push(updatedContact)
    }

    updatedMetadata[API_DATA_PRODUCER_PROPERTY] = updatedProducer
    updatedMetadata[API_DATA_CONTACTS_PROPERTY] = updatedContacts
    updatedMetadataList.push(updatedMetadata)
    // log.d(mod, fun, `updatedMetadata: ${updatedMetadata}`)
  }

  return updatedMetadataList
}