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

exports.producerRudiToDbFormat = async (rudiProducer) => {
  const fun = 'producerRudiToDbFormat'
  log.d(fun, ``)
  if (!rudiProducer) throw new Error(`${msg.parameterExpected(fun, 'rudiProducer')}`)

  const organizationDbId = await db.getEnsuredOrganizationDbIdWithJson(rudiProducer)
  log.d(fun, `organizationDbId: ${organizationDbId}`)
  return organizationDbId
}

exports.contactsRudiToDbFormat = async (rudiContactList) => {
  const fun = 'contactsRudiToDbFormat'
  log.d(fun, ``)
  if (!rudiContactList) throw new Error(`${msg.parameterExpected(fun, 'rudiContactList')}`)

  let contactDbIds = []
  await Promise.all(rudiContactList.map(
    async (rudiContact) => {
      log.d(fun, `contact: ${JSON.stringify(rudiContact)}`)
      const contactDbId = await db.getEnsuredContactDbIdWithJson(rudiContact)
      contactDbIds.push(contactDbId)
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

exports.producerDbToRudiFormat = async (producerDbId) => {
  const fun = 'producerDbToRudiFormat'
  log.d(fun, ``)
  if (!producerDbId) throw new Error(`${msg.parameterExpected(fun, 'producerDbId')}`)

  const organization = await db.getEnsuredOrganizationWithDbId(producerDbId)
  log.d(fun, `organizationDbId: ${JSON.stringify(organization)}`)
  return organization
}

exports.contactsDbToRudiFormat = async (contactsDbIds) => {
  const fun = 'contactsDbToRudiFormat'
  log.d(fun, ``)
  if (!contactsDbIds) throw new Error(`${msg.parameterExpected(fun, 'contactsDbIds')}`)

  let contacts = []
  await Promise.all(contactsDbIds.map(
    async (contactDbId) => {
      const contact = await db.getEnsuredContactWithDbId(contactDbId)
      log.d(fun, `contact: ${JSON.stringify(contact)}`)
      contacts.push(contact)
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
      dbReadyMetadata[API_PRODUCER_PROPERTY] = await this.producerRudiToDbFormat(producer)
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
      dbReadyMetadata[API_CONTACTS_PROPERTY] = await this.contactsRudiToDbFormat(contacts)
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
        dbReadyMetadata[API_METAINFO_PROPERTY][API_METAINFO_PROVIDER_PROPERTY] = await this.producerRudiToDbFormat(metaInfoProvider)
      }

      let metaInfoContacts = metaInfo[API_METAINFO_CONTACTS_PROPERTY]
      if (!!metaInfoContacts) {
        dbReadyMetadata[API_METAINFO_PROPERTY][API_METAINFO_PROVIDER_PROPERTY] = await this.contactsRudiToDbFormat(metaInfoContacts)
      }

      // let metaInfoDates = metaInfo[API_METAINFO_DATES_PROPERTY]

    }

    return dbReadyMetadata
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}


exports.createMetadata = async (rudiMetadata) => {
  const fun = 'newMetadata'
  log.d(fun, ``)
  if (!rudiMetadata) throw new Error(`${msg.parameterExpected(fun, rudiMetadata)}`)

  // Special treatment!
  log.d(fun, `incoming object: ${JSON.stringify(rudiMetadata)}`)

  let dbReadyObject = await this.rudiToDbFormat(rudiMetadata, true)
  log.d(fun, `DB ready object: ${JSON.stringify(dbReadyObject)}`)


  const newMetadata = new Metadata(dbReadyObject)
  return newMetadata
}

//———————————————————————————————————————————————————————————————
// Global treatments of properties: DB -> RUDI
//———————————————————————————————————————————————————————————————

exports.dbToRudiFormat = async (dbMetadata) => {
  const fun = 'dbToRudiFormat'
  log.d(fun, ``)

  /* beautify ignore:start */
  let rudyMetadata = {...dbMetadata}
  /* beautify ignore:end */

  // ad hoc Metadata treatments: retrieve Producer and Contact info
  const organizationDbId = json.accessProperty(dbMetadata, API_PRODUCER_PROPERTY)
  const contactsDbIds = json.accessProperty(dbMetadata, API_CONTACTS_PROPERTY)

  // Updating incoming data with the full info of the organization
  // TODO[VALIDATE]: The organization info already in database is not updated with possible new data, 
  //                 and only the organization RUDI id is really necessary in the request body    
  rudyMetadata[API_PRODUCER_PROPERTY] = await this.producerDbToRudiFormat(organizationDbId)

  // Updating incoming data with the full info of the organization
  // TODO[VALIDATE]: The contact info already in database is not updated with possible new data, 
  //                 and only the contact RUDI id is really necessary in the request body
  rudyMetadata[API_CONTACTS_PROPERTY] = await this.contactsDbToRudiFormat(contactsDbIds)

  // objectData[API_CONTACTS_PROPERTY] = await dbRwk.updateJsonContactList(contacts)

  // TODO: treat metadataInfo
  return rudyMetadata
}

