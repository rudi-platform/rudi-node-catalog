'use strict';

const mod = 'metaCtrl'
/*
 * In this file are made the different steps followed for each 
 * action on the metadata
 */

//———————————————————————————————————————————————————————————————
// External dependancies 
//———————————————————————————————————————————————————————————————
const boom = require('@hapi/boom')
const _ = require('lodash')

//———————————————————————————————————————————————————————————————
// Internal dependancies 
//———————————————————————————————————————————————————————————————
const log = require('../utils/logging')
const msg = require('../utils/msg')
const lang = require('../utils/lang')
const smpl = require('../utils/jsShortcuts')

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
  API_DATA_PRODUCER_PROPERTY,
  API_DATA_CONTACTS_PROPERTY,
  API_DATA_DATES_PROPERTY,
  API_METAINFO_PROPERTY,
  API_METAINFO_PROVIDER_PROPERTY,
  API_METAINFO_CONTACTS_PROPERTY,
  API_METAINFO_DATES_PROPERTY,
  API_DATES_CREATED_PROPERTY,
  API_DATES_EDITED_PROPERTY,
} = require('../db/dbFields')

const {
  PARAM_LANG,
  PARAM_ID,
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
  const fun = 'organizationRudiToDbFormat'
  log.d(mod, fun, ``)
  if (null == rudiProducer) throw new Error(`${msg.parameterExpected(fun, 'rudiProducer')}`)

  const organizationDbId = await db.getEnsuredOrganizationDbIdWithJson(rudiProducer)
  log.d(mod, fun, `${json.beautify(rudiProducer)} -> ${organizationDbId} `)
  return organizationDbId
}

exports.contactListRudiToDbFormat = async (rudiContactList) => {
  const fun = 'contactListRudiToDbFormat'
  log.d(mod, fun, ``)
  if (null == rudiContactList) throw new Error(`${msg.parameterExpected(fun, 'rudiContactList')}`)

  let contactDbIds = []
  await Promise.all(rudiContactList.map(
    async (rudiContact) => {
      const contactDbId = await db.getEnsuredContactDbIdWithJson(rudiContact)
      contactDbIds.push(contactDbId)
      log.d(mod, fun, `${json.beautify(rudiContact)} -> ${contactDbId}`)
    }));
  return contactDbIds
}

exports.setCreateDateInRudiObject = async (rudiMetadata, createDate) => {
  const fun = 'setCreateDateInRudiObject'
  log.d(mod, fun, ``)
  if (null == rudiMetadata) throw new Error(`${msg.parameterExpected(fun, 'rudiMetadata')}`)
  if (null == createDate) createDate == smpl.nowISO()
  /* 
    let metaInfo = json.accessProperty(rudiMetadata, API_METAINFO_PROPERTY)
    let metaInfoDates = json.accessProperty(rudiMetadata, API_METAINFO_DATES_PROPERTY)
    let metaInfoDateCreated = json.accessProperty(rudiMetadata, API_METAINFO_DATES_CREATED_PROPERTY)
   */
  rudiMetadata[API_METAINFO_PROPERTY][API_METAINFO_DATES_PROPERTY][API_DATES_CREATED_PROPERTY] = createDate
  return rudiMetadata
}

exports.getCreateDateInRudiObject = async (rudiMetadata) => {
  const fun = 'getCreateDateInRudiObject'
  log.d(mod, fun, ``)
  if (null == rudiMetadata) throw new Error(`${msg.parameterExpected(fun, 'rudiMetadata')}`)
  /* 
    let metaInfo = json.accessProperty(rudiMetadata, API_METAINFO_PROPERTY)
    let metaInfoDates = json.accessProperty(rudiMetadata, API_METAINFO_DATES_PROPERTY)
    let metaInfoDateCreated = json.accessProperty(rudiMetadata, API_METAINFO_DATES_CREATED_PROPERTY)
   */
  return rudiMetadata[API_METAINFO_PROPERTY][API_METAINFO_DATES_PROPERTY][API_DATES_CREATED_PROPERTY]
}

exports.setEditDateInRudiObject = async (rudiMetadata, editDate) => {
  const fun = 'setEditDateInRudiObject'
  log.d(mod, fun, ``)
  try {
    if (null == rudiMetadata) throw new Error(`${msg.parameterExpected(fun, 'rudiMetadata')}`)
    if (null == editDate) editDate == smpl.nowISO()

    /* 
      let metaInfo = json.accessProperty(rudiMetadata, API_METAINFO_PROPERTY)
      let metaInfoDates = json.accessProperty(rudiMetadata, API_METAINFO_DATES_PROPERTY)
      let metaInfoDateCreated = json.accessProperty(rudiMetadata, API_METAINFO_DATES_CREATED_PROPERTY)
     */
    rudiMetadata[API_METAINFO_PROPERTY][API_METAINFO_DATES_PROPERTY][API_DATES_EDITED_PROPERTY] = editDate
    return rudiMetadata
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}

exports.getDbCreateDateWithRudiId = async (rudiId) => {
  const fun = 'getDbCreateDateFromRudiId'
  log.d(mod, fun, ``)
  try {
    if (null == rudiId) throw new Error(`${msg.parameterExpected(fun, 'rudiId')}`)
    /* 
      let metaInfo = json.accessProperty(rudiMetadata, API_METAINFO_PROPERTY)
      let metaInfoDates = json.accessProperty(rudiMetadata, API_METAINFO_DATES_PROPERTY)
      let metaInfoDateCreated = json.accessProperty(rudiMetadata, API_METAINFO_DATES_CREATED_PROPERTY)
     */
    const rudiMetadata = db.getEnsuredMetadataWithRudiId(rudiId)
    return rudiMetadata[API_METAINFO_PROPERTY][API_METAINFO_DATES_PROPERTY][API_DATES_CREATED_PROPERTY]
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}
//———————————————————————————————————————————————————————————————
// Atomic treatments of properties: DB -> RUDI
//———————————————————————————————————————————————————————————————

exports.organizationDbToRudiFormat = async (producerDbId) => {
  const fun = 'organizationDbToRudiFormat'
  log.d(mod, fun, ``)
  if (null == producerDbId) throw new Error(`${msg.parameterExpected(fun, 'producerDbId')}`)

  const dbOrganization = await db.getEnsuredOrganizationWithDbId(producerDbId)
  log.d(mod, fun, `dbOrganization -> ${json.beautify(dbOrganization)}`)
  // const cleanedOrganization = dbRwk.unmongoosify(dbOrganization)
  // log.d(mod, fun, `${producerDbId} -> ${json.beautify(cleanedOrganization)}`)
  return dbOrganization
}

exports.contactListDbToRudiFormat = async (contactsDbIds) => {
  const fun = 'contactListDbToRudiFormat'
  log.d(mod, fun, ``)
  log.d(mod, fun, `contactsDbIds: ${json.beautify(contactsDbIds)}`)
  if (null == contactsDbIds) throw new Error(`${msg.parameterExpected(fun, 'contactsDbIds')}`)

  let contacts = []
  await Promise.all(contactsDbIds.map(
    async (contactDbId) => {
      // log.d(mod, fun, `contactDbId: ${contactDbId}`)
      const contact = await db.getEnsuredContactWithDbId(contactDbId)
      // contacts.push(dbRwk.unmongoosify(contact))
      contacts.push(contact)
      log.d(mod, fun, `${contactDbId} -> ${json.beautify(contact)}`)
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
  log.d(mod, fun, ``)

  let dbReadyMetadata = json.deepClone(rudiMetadata)

  try {
    //----- Updating producer field with db instead of incoming data
    // TODO[VALIDATE]: The organization info already in database is not updated with possible new data, 
    //                 and only the organization RUDI id is really necessary in the request body    
    let producer
    if (shouldBeStrict) {
      producer = json.accessProperty(dbReadyMetadata, API_DATA_PRODUCER_PROPERTY)
    } else {
      producer = dbReadyMetadata[API_DATA_PRODUCER_PROPERTY]
    }
    if (!!producer) {
      dbReadyMetadata[API_DATA_PRODUCER_PROPERTY] = await this.organizationRudiToDbFormat(producer)
    }

    //----- Updating contacts field with db instead of incoming data
    // TODO[VALIDATE]: The contact info already in database is not updated with possible new data, 
    //                 and only the contact RUDI id is really necessary in the request body
    let contacts
    if (shouldBeStrict) {
      contacts = json.accessProperty(dbReadyMetadata, API_DATA_CONTACTS_PROPERTY)
    } else {
      contacts = dbReadyMetadata[API_DATA_CONTACTS_PROPERTY]
    }
    if (contacts.length > 0) {
      dbReadyMetadata[API_DATA_CONTACTS_PROPERTY] = await this.contactListRudiToDbFormat(contacts)
    }
    // log.d(mod, fun, `objectData: ${json.beautify(objectData)}`)


    //----- Updating metadataInfo.metadata_provider field (same as above producer organization) with db instead of incoming data
    // TODO[VALIDATE]: The organization info already in database is not updated with possible new data, 
    //                 and only the contact RUDI id is really necessary in the request body  
    let metaInfo
    if (shouldBeStrict) {
      metaInfo = json.accessProperty(dbReadyMetadata, API_METAINFO_PROPERTY)
    } else {
      metaInfo = dbReadyMetadata[API_METAINFO_PROPERTY]
    }
    if (!!metaInfo) { // following fields are not required, so 'shouldBeStrict is irrelevant
      let metaInfoProvider = metaInfo[API_METAINFO_PROVIDER_PROPERTY]
      if (!!metaInfoProvider) {
        dbReadyMetadata[API_METAINFO_PROPERTY][API_METAINFO_PROVIDER_PROPERTY] = await this.organizationRudiToDbFormat(metaInfoProvider)
      }

      let metaInfoContacts = metaInfo[API_METAINFO_CONTACTS_PROPERTY]
      if (null != metaInfoContacts && metaInfoContacts.length > 0) {
        dbReadyMetadata[API_METAINFO_PROPERTY][API_METAINFO_CONTACTS_PROPERTY] = await this.contactListRudiToDbFormat(metaInfoContacts)
      }
    }

    return dbReadyMetadata
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}

//———————————————————————————————————————————————————————————————
// Global treatments of properties: DB -> RUDI
//———————————————————————————————————————————————————————————————

exports.dbToRudiFormat = async (dbMetadata) => {
  const fun = 'dbToRudiFormat'
  log.d(mod, fun, ``)

  // log.d(mod, fun, `dbMetadata: ${json.beautify(dbMetadata)}`)
  let rudiMetadata = dbRwk.unmongoosify(dbMetadata)
  // log.d(mod, fun, `rudiMetadata: ${json.beautify(rudiMetadata)}`)

  // Updating incoming data with the full info of the producer
  // TODO[VALIDATE]: The organization info already in database is not updated with possible new data, 
  //                 and only the organization RUDI id is really necessary in the request body    
  const organizationDbId = json.accessProperty(rudiMetadata, API_DATA_PRODUCER_PROPERTY)
  rudiMetadata[API_DATA_PRODUCER_PROPERTY] = await this.organizationDbToRudiFormat(organizationDbId)

  // Updating incoming data with the full info of each contact
  // TODO[VALIDATE]: The contact info already in database is not updated with possible new data, 
  //                 and only the contact RUDI id is really necessary in the request body
  const contactsDbIds = json.accessProperty(rudiMetadata, API_DATA_CONTACTS_PROPERTY)
  rudiMetadata[API_DATA_CONTACTS_PROPERTY] = await this.contactListDbToRudiFormat(contactsDbIds)

  // Updating incoming data with the full info of the metadata info
  const cleanMetaInfo = json.accessProperty(rudiMetadata, API_METAINFO_PROPERTY)
  // log.d(mod, fun, `metaInfo: ${json.beautify(cleanMetaInfo)}`)
  // const cleanMetaInfo = dbRwk.unmongoosify(metaInfo)
  // log.d(mod, fun, `cleanMetaInfo: ${json.beautify(cleanMetaInfo)}`)

  // Updating incoming data with the full info of the metadata info provider organization
  const metaInfoProviderDbId = cleanMetaInfo[API_METAINFO_PROVIDER_PROPERTY]
  if (!!metaInfoProviderDbId) {
    cleanMetaInfo[API_METAINFO_PROVIDER_PROPERTY] = await this.organizationDbToRudiFormat(metaInfoProviderDbId)
  }
  // Updating incoming data with the full info of each of the metadata info contacts
  const metaInfoContactsDbIds = cleanMetaInfo[API_METAINFO_CONTACTS_PROPERTY]
  if (metaInfoContactsDbIds.length != 0) {
    cleanMetaInfo[API_METAINFO_CONTACTS_PROPERTY] = await this.contactListDbToRudiFormat(metaInfoContactsDbIds)
  }
  rudiMetadata[API_METAINFO_PROPERTY] = cleanMetaInfo
  // log.d(mod, fun, `rudiMetadata: ${json.beautify(rudiMetadata)}`)

  return rudiMetadata
}


exports.dbToRudiFormatList = async (dbMetadataList) => {
  const fun = 'dbToRudiFormatList'
  log.d(mod, fun, ``)

  let rudiMetadataList = []
  await Promise.all(dbMetadataList.map(
    async (dbMetadata) => {
      const rudiMetadata = await this.dbToRudiFormat(dbMetadata)
      rudiMetadataList.push(rudiMetadata)
    }
  ))
  return rudiMetadataList
}
//———————————————————————————————————————————————————————————————
// High level actions
//———————————————————————————————————————————————————————————————

exports.newMetadata = async (rudiMetadata) => {
  const fun = 'newMetadata'
  log.d(mod, fun, ``)
  if (!rudiMetadata) throw new Error(`${msg.parameterExpected(fun, 'rudiMetadata')}`)

  log.d(mod, fun, `incoming object: ${json.beautify(rudiMetadata)}`)

  // Special treatment!
  let dbReadyObject = await this.rudiToDbFormat(rudiMetadata, true)

  // Special update for metadataInfo.referenceDates: update 'createdDate' 
  // this.setCreateDateInRudiObject(dbReadyObject)

  log.d(mod, fun, `DB ready object: ${json.beautify(dbReadyObject)}`)

  const dbReadyMetadata = await new Metadata(dbReadyObject)

  return dbReadyMetadata
}

exports.updateMetadata = async (editedRudiMetadata) => {
  const fun = 'editMetadata'
  log.d(mod, fun, ``)

  if (null == editedRudiMetadata) throw new Error(`${msg.parameterExpected(fun, 'editedRudiMetadata')}`)
  log.d(mod, fun, `edited metadata: ${json.beautify(editedRudiMetadata)}\n`)

  // ensure the object exists
  const rudiId = json.accessProperty(editedRudiMetadata, API_METADATA_ID)
  let existingDbMetadata = await db.getEnsuredMetadataWithRudiId(rudiId)
  log.v(mod, fun, `corresponding db object: ${json.beautify(existingDbMetadata)}\n`)

  let dbReadyEditedMetadata = await this.rudiToDbFormat(editedRudiMetadata, true)
  log.v(mod, fun, `dbReadyEditedMetadata: ${json.beautify(dbReadyEditedMetadata)}\n`)

  // Updating 'dataset_dates' field with changed ones while keeping other dates
  const existingDataDates = existingDbMetadata[API_DATA_DATES_PROPERTY]
  log.d(mod, fun, `existingDataDates: ${json.beautify(existingDataDates)}`)

  const updatedDataDates = editedRudiMetadata[API_DATA_DATES_PROPERTY]
  log.d(mod, fun, `updatedDataDates: ${json.beautify(updatedDataDates)}`)

  if (!updatedDataDates) {
    dbReadyEditedMetadata[API_DATA_DATES_PROPERTY] = existingDataDates
  } else {
    let dataDates = json.deepClone(existingDataDates)
    for (let [dateField, refDate] of Object.entries(updatedDataDates)) {
      dataDates[dateField] = refDate
    }
    dbReadyEditedMetadata[API_DATA_DATES_PROPERTY] = dataDates
  }

  // Updating 'metadata_info.metadata_dates' field with changed ones while keeping other dates
  // Special : 
  // - 'metadata_info.reference_dates.created' must not be updated!
  // - 'metadata_info.reference_dates.updated' must be updated!
  const existingMetaDates = existingDbMetadata[API_METAINFO_PROPERTY][API_METAINFO_DATES_PROPERTY]
  const existingMetaCreateDate = existingMetaDates[API_DATES_CREATED_PROPERTY]
  const updatedMetaDates = dbReadyEditedMetadata[API_METAINFO_PROPERTY][API_METAINFO_DATES_PROPERTY]

  let metaDates = json.deepClone(existingMetaDates)
  for (let [dateField, refDate] of Object.entries(updatedMetaDates)) {
    // - 'metadata_info.reference_dates.created' must not be updated!
    if (dateField == API_DATES_CREATED_PROPERTY) continue // metainfo 'created' should stay immutable
    metaDates[dateField] = refDate
  }
  dbReadyEditedMetadata[API_METAINFO_PROPERTY][API_METAINFO_DATES_PROPERTY] = metaDates

  // - 'metadata_info.reference_dates.updated' must be updated!
  this.setEditDateInRudiObject(dbReadyEditedMetadata) // metainfo 'updated' is updated to now

  log.d(mod, fun, `DB ready object: ${json.beautify(dbReadyEditedMetadata)}`)

  const completeRudiMetadata = await this.dbToRudiFormat(dbReadyEditedMetadata)
  const dbUpdatedMetadata = Metadata.update(completeRudiMetadata)
  dbUpdatedMetadata.save()
  
  log.d(mod, fun, `returned object: ${json.beautify(completeRudiMetadata)}`)

  return completeRudiMetadata
}