/*
 * In this file are made the different steps followed for each 
 * action on the metadata
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
const lang = require('../utils/lang')

const db = require('../db/dbQueries')
const dbRwk = require('../db/dbReworkData')
const json = require('../utils/jsonAccess')

//———————————————————————————————————————————————————————————————
// Constants
//———————————————————————————————————————————————————————————————
const {
  DB_ID,
  DB_V,
  API_METADATA_ID,
  API_ORGANIZATION_ID,
  API_CONTACT_ID,
  API_PRODUCER_PROPERTY,
  API_CONTACTS_PROPERTY,
  API_METAINFO_PROPERTY,
  API_METAINFO_PROVIDER_PROPERTY,
  API_METAINFO_CONTACTS_PROPERTY,
  API_METAINFO_DATES_PROPERTY,
  API_METAINFO_DATES_CREATED_PROPERTY,
} = require('../db/dbFields')

const {
  PARAM_LANG: REQ_LANG,
  PARAM_ID: REQ_ID,
  URL_OBJECT_ORGANIZATIONS,
  URL_OBJECT_CONTACTS
} = require('../config/confApi')

//———————————————————————————————————————————————————————————————
// Data models
//———————————————————————————————————————————————————————————————
const Metadata = require('../definitions/models/Metadata')
const Organization = require('../definitions/models/Organization')
const Contact = require('../definitions/models/Contact')


//———————————————————————————————————————————————————————————————
// Atomic treatments of properties: RUDI -> DB
//———————————————————————————————————————————————————————————————

exports.organizationRudiToDbFormat = async (rudiProducer) => {
  const fun = 'producerRudiToDbFormat'
  log.d(fun, ``)
  if (!rudiProducer) throw new Error(`${msg.parameterExpected(fun, 'rudiProducer')}`)

  const organizationDbId = await db.getEnsuredOrganizationDbIdWithJson(rudiProducer)
  log.d(fun, `${JSON.stringify(rudiProducer)} -> ${organizationDbId} `)
  return organizationDbId
}

exports.contactListRudiToDbFormat = async (rudiContactList) => {
  const fun = 'contactsRudiToDbFormat'
  log.d(fun, ``)
  if (!rudiContactList) throw new Error(`${msg.parameterExpected(fun, 'rudiContactList')}`)

  let contactDbIds = []
  await Promise.all(rudiContactList.map(
    async (rudiContact) => {
      const contactDbId = await db.getEnsuredContactDbIdWithJson(rudiContact)
      contactDbIds.push(contactDbId)
      log.d(fun, `${JSON.stringify(rudiContact)} -> ${contactDbId}`)
    }));
  return contactDbIds
}

exports.setCreationDate = async (rudiMetadata) => {
  const fun = 'setCreationDate'
  log.d(fun, ``)
  if (!rudiMetadata) throw new Error(`${msg.parameterExpected(fun, 'rudiMetadata')}`)

  let metaInfo = json.accessProperty(rudiMetadata, API_METAINFO_PROPERTY)
  let metaInfoDates = json.accessProperty(rudiMetadata, API_METAINFO_DATES_PROPERTY)
  let metaInfoDateCreated = json.accessProperty(rudiMetadata, API_METAINFO_DATES_CREATED_PROPERTY)

  rudiMetadata[API_METAINFO_PROPERTY][API_METAINFO_DATES_PROPERTY][API_METAINFO_DATES_CREATED_PROPERTY] = new Date().toISOString()
}

//———————————————————————————————————————————————————————————————
// Atomic treatments of properties: DB -> RUDI
//———————————————————————————————————————————————————————————————

exports.organizationDbToRudiFormat = async (producerDbId) => {
  const fun = 'organizationDbToRudiFormat'
  log.d(fun, ``)
  if (!producerDbId) throw new Error(`${msg.parameterExpected(fun, 'producerDbId')}`)

  const organization = await db.getEnsuredOrganizationWithDbId(producerDbId)
  log.d(fun, `${producerDbId} -> ${JSON.stringify(organization)}`)
  return organization
}

exports.contactListDbToRudiFormat = async (contactsDbIds) => {
  const fun = 'contactListDbToRudiFormat'
  log.d(fun, ``)
  if (!contactsDbIds) throw new Error(`${msg.parameterExpected(fun, 'contactsDbIds')}`)

  let contacts = []
  await Promise.all(contactsDbIds.map(
    async (contactDbId) => {
      const contact = await db.getEnsuredContactWithDbId(contactDbId)
      contacts.push(contact)
      log.d(fun, `${contactDbId} -> ${JSON.stringify(contact)}`)
    }));
  return contacts
}

//———————————————————————————————————————————————————————————————
// Global treatments of properties: RUDI -> DB
//———————————————————————————————————————————————————————————————

/** 
 * Format a RUDI Metadata document (JSON):
 * @param rudiMetadata: the RUDI Metadata JSON object
 * @param shouldBeStrict: if required fields presence should be ensured (e.g. yes for creation, no for update)
 */
exports.rudiToDbFormat = async (rudiMetadata, shouldBeStrict) => {
  const fun = 'rudiToDbFormat'
  log.d(fun, ``)

  /* beautify ignore:start */
  let dbReadyMetadata = {...rudiMetadata}
  /* beautify ignore:end */

  try {
    //----- Updating producer field with db instead of incoming data
    // TODO[VALIDATE]: The organization info already in database is not updated with possible new data, 
    //                 and only the organization RUDI id is really necessary in the request body    
    let producer
    if (shouldBeStrict) {
      producer = json.accessProperty(rudiMetadata, API_PRODUCER_PROPERTY)
    } else {
      producer = rudiMetadata[API_PRODUCER_PROPERTY]
    }
    if (!!producer) {
      dbReadyMetadata[API_PRODUCER_PROPERTY] = await this.organizationRudiToDbFormat(producer)
    }

    //----- Updating contacts field with db instead of incoming data
    // TODO[VALIDATE]: The contact info already in database is not updated with possible new data, 
    //                 and only the contact RUDI id is really necessary in the request body
    let contacts
    if (shouldBeStrict) {
      contacts = json.accessProperty(rudiMetadata, API_CONTACTS_PROPERTY)
    } else {
      contacts = rudiMetadata[API_CONTACTS_PROPERTY]
    }
    if (!!contacts) {
      dbReadyMetadata[API_CONTACTS_PROPERTY] = await this.contactListRudiToDbFormat(contacts)
    }
    // log.d(fun, `objectData: ${JSON.stringify(objectData)}`)


    //----- Updating metadataInfo.metadata_provider field (same as above producer organization) with db instead of incoming data
    // TODO[VALIDATE]: The organization info already in database is not updated with possible new data, 
    //                 and only the contact RUDI id is really necessary in the request body  
    let metaInfo
    if (shouldBeStrict) {
      metaInfo = json.accessProperty(rudiMetadata, API_METAINFO_PROPERTY)
    } else {
      metaInfo = rudiMetadata[API_METAINFO_PROPERTY]
    }
    if (!!metaInfo) {
      let metaInfoProvider = metaInfo[API_METAINFO_PROVIDER_PROPERTY]
      if (!!metaInfoProvider) {
        dbReadyMetadata[API_METAINFO_PROPERTY][API_METAINFO_PROVIDER_PROPERTY] = await this.organizationRudiToDbFormat(metaInfoProvider)
      }

      let metaInfoContacts = metaInfo[API_METAINFO_CONTACTS_PROPERTY]
      if (!!metaInfoContacts) {
        dbReadyMetadata[API_METAINFO_PROPERTY][API_METAINFO_PROVIDER_PROPERTY] = await this.contactListRudiToDbFormat(metaInfoContacts)
      }

      // let metaInfoDates = metaInfo[API_METAINFO_DATES_PROPERTY]

    }

    return dbReadyMetadata
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

//———————————————————————————————————————————————————————————————
// Global treatments of properties: DB -> RUDI
//———————————————————————————————————————————————————————————————

exports.dbToRudiFormat = async (dbMetadata) => {
  const fun = 'dbToRudiFormat'
  log.d(fun, ``)

  /* beautify ignore:start */
  let rudyMetadata = dbMetadata
  /* beautify ignore:end */
  log.d(fun, `rudyMetadata: ${JSON.stringify(rudyMetadata)}`)

  // Updating incoming data with the full info of the producer
  // TODO[VALIDATE]: The organization info already in database is not updated with possible new data, 
  //                 and only the organization RUDI id is really necessary in the request body    
  const organizationDbId = json.accessProperty(dbMetadata, API_PRODUCER_PROPERTY)
  rudyMetadata[API_PRODUCER_PROPERTY] = await this.organizationDbToRudiFormat(organizationDbId)
  
  // Updating incoming data with the full info of each contact
  // TODO[VALIDATE]: The contact info already in database is not updated with possible new data, 
  //                 and only the contact RUDI id is really necessary in the request body
  const contactsDbIds = json.accessProperty(dbMetadata, API_CONTACTS_PROPERTY)
  rudyMetadata[API_CONTACTS_PROPERTY] = await this.contactListDbToRudiFormat(contactsDbIds)

  // Updating incoming data with the full info of the metadata info provider organization
  const metaInfo = json.accessProperty(dbMetadata, API_METAINFO_PROPERTY)
  const metaInfoProviderDbId = json.accessProperty(metaInfo, API_METAINFO_PROVIDER_PROPERTY)
  rudyMetadata[API_METAINFO_PROPERTY][API_METAINFO_PROVIDER_PROPERTY] = await this.organizationDbToRudiFormat(metaInfoProviderDbId)
  
  // Updating incoming data with the full info of each of the metadata info contacts
  const metaInfoContactsDbIds = json.accessProperty(metaInfo, API_METAINFO_CONTACTS_PROPERTY)
  rudyMetadata[API_METAINFO_PROPERTY][API_METAINFO_CONTACTS_PROPERTY] = await this.contactListDbToRudiFormat(metaInfoContactsDbIds)

  return rudyMetadata
}


//———————————————————————————————————————————————————————————————
// High level actions
//———————————————————————————————————————————————————————————————

exports.newMetadata = async (rudiMetadata) => {
  const fun = 'newMetadata'
  log.d(fun, ``)
  if (!rudiMetadata) throw new Error(`${msg.parameterExpected(fun, rudiMetadata)}`)

  // Special treatment!
  log.d(fun, `incoming object: ${JSON.stringify(rudiMetadata)}`)

  let dbReadyObject = await this.rudiToDbFormat(rudiMetadata, true)
  log.d(fun, `DB ready object: ${JSON.stringify(dbReadyObject)}`)


  const dbMetadata = new Metadata(dbReadyObject)
  return dbMetadata
}
