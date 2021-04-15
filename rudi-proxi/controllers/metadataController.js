'use strict';

const mod = 'metaCtrl'
/*
 * In this file are made the different steps followed for each 
 * action on the metadata
 */

//---------------------------------------------------------------
// External dependancies 
//---------------------------------------------------------------
const boom = require('@hapi/boom')
const _ = require('lodash')

//---------------------------------------------------------------
// Internal dependancies 
//---------------------------------------------------------------
const log = require('../utils/logging')
const msg = require('../utils/msg')
const lang = require('../utils/lang')
const utils = require('../utils/jsUtils')

const db = require('../db/dbQueries')
const dbRwk = require('../db/dbReworkData')
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
  API_DATA_CONTACTS_PROPERTY,

  API_MEDIA_PROPERTY,
  API_MEDIA_TYPE_PROPERTY,

  API_DATA_DATES_PROPERTY,
  API_DATES_CREATED_PROPERTY,
  API_DATES_EDITED_PROPERTY,

  API_METAINFO_PROPERTY,
  API_METAINFO_PROVIDER_PROPERTY,
  API_METAINFO_CONTACTS_PROPERTY,
  API_METAINFO_DATES_PROPERTY,

} = require('../db/dbFields')

const {
  PARAM_LANG,
  PARAM_ID,
  URL_OBJECT_ORGANIZATIONS,
  URL_OBJECT_CONTACTS,
  URL_OBJECT_MEDIA
} = require('../config/confApi')

//---------------------------------------------------------------
// Data models
//---------------------------------------------------------------
const Metadata = require('../definitions/models/Metadata')
const Organization = require('../definitions/models/Organization')
const Contact = require('../definitions/models/Contact');
const {
  Media,
  MediaFile,
  MediaSeries
} = require('../definitions/models/Media');
const {
  MediaTypes
} = require('../definitions/thesaurus/MediaTypes');


//---------------------------------------------------------------
// Atomic treatments of properties: RUDI -> DB
//---------------------------------------------------------------

exports.organizationRudiToDbFormat = async (rudiProducer, shouldCreateIfNotFound) => {
  const fun = 'organizationRudiToDbFormat'
  log.d(mod, fun, ``)
  if (null == rudiProducer) throw new Error(`${msg.parameterExpected(fun, 'rudiProducer')}`)

  const organizationDbId = await db.getOrganizationDbIdWithJson(rudiProducer)

  if (!organizationDbId) {
    if (!shouldCreateIfNotFound) throw err
    const newOrg = new Organization(rudiProducer)
    newOrg.save()
    organizationDbId = newOrg[DB_ID]
  }
  log.d(mod, fun, `${json.beautify(rudiProducer)} -> ${organizationDbId} `)
  return organizationDbId
}

exports.contactListRudiToDbFormat = async (rudiContactList, shouldCreateIfNotFound) => {
  const fun = 'contactListRudiToDbFormat'
  log.d(mod, fun, ``)
  if (null == rudiContactList) throw new Error(`${msg.parameterExpected(fun, 'rudiContactList')}`)

  let contactDbIds = []
  await Promise.all(rudiContactList.map(async (rudiContact) => {
    let contactDbId
    contactDbId = await db.getContactDbIdWithJson(rudiContact)
    if (!contactDbId) {
      if (!shouldCreateIfNotFound) throw new Error(`${msg.objectNotFound(URL_OBJECT_CONTACTS, rudiId)}`)

      const newContact = new Contact(rudiContact)
      newContact.save()
      contactDbId = newContact[DB_ID]
    }
    contactDbIds.push(contactDbId)
    log.d(mod, fun, `${json.beautify(rudiContact)} -> ${contactDbId}`)
  }));
  return contactDbIds
}


exports.mediaListRudiToDbFormat = async (rudiMediaList, shouldCreateIfNotFound) => {
  const fun = 'mediaListRudiToDbFormat'
  log.d(mod, fun, ``)
  // log.d(mod, fun, `rudiMediaList: ${json.beautify(rudiMediaList)}`)
  if (null == rudiMediaList) throw new Error(`${msg.parameterExpected(fun, 'rudiMediaList')}`)

  let mediaDbIds = []
  await Promise.all(rudiMediaList.map(async (rudiMedia) => {
    // log.d(mod, fun, `rudiMedia: ${json.beautify(rudiMedia)}`)

    let mediaDbId
    mediaDbId = await db.getMediaDbIdWithJson(rudiMedia)

    if (!mediaDbId) {
      if (!shouldCreateIfNotFound) throw new Error(`${msg.objectNotFound(URL_OBJECT_MEDIA, rudiId)}`)

      // log.d(mod, fun, `rudiMedia[API_MEDIA_TYPE_PROPERTY]: ${json.beautify(rudiMedia[API_MEDIA_TYPE_PROPERTY])}`)
      let media
      switch (rudiMedia[API_MEDIA_TYPE_PROPERTY]) {
        case MediaTypes.File:
          log.d(mod, fun, `new MediaFile`)
          media = await new MediaFile(rudiMedia)
          break;
        case MediaTypes.Series:
          log.d(mod, fun, `new MediaSeries`)
          media = await new MediaSeries(rudiMedia)
          break;
        default:
          const errMsg = `'${rudiMedia[API_MEDIA_PROPERTY]}' is not a recognized Media type`
          log.e(mod, fun, errMsg)
          throw new Error(errMsg)
      }
      log.d(mod, fun, `new media: ${json.beautify(media)}`)

      // log.d(mod, fun, media)
      const dbActionResult = await media.save();
      log.d(mod, fun, `dbActionResult: ${json.beautify(dbActionResult)}`)

      mediaDbId = media[DB_ID];
      log.d(mod, fun, `newly created mediaDbId: ${json.beautify(mediaDbId)}`)

    }
    mediaDbIds.push(mediaDbId)
    log.d(mod, fun, `${json.beautify(rudiMedia)} -> ${mediaDbId} `)
  }));
  return mediaDbIds
}

exports.setCreateDateInRudiObject = async (rudiMetadata, createDate) => {
  const fun = 'setCreateDateInRudiObject'
  log.d(mod, fun, ``)
  if (null == rudiMetadata) throw new Error(`${msg.parameterExpected(fun, 'rudiMetadata')}`)
  if (null == createDate) createDate == utils.nowISO()
  /* 
    let metaInfo = json.accessProperty(rudiMetadata, API_METAINFO_PROPERTY)
    let metaInfoDates = json.accessProperty(rudiMetadata, API_METAINFO_DATES_PROPERTY)
    let metaInfoDateCreated = json.accessProperty(rudiMetadata, API_METAINFO_DATES_CREATED_PROPERTY)
   */

  // TODO: check if create date already set?
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
  let metaInfo = json.accessProperty(rudiMetadata, API_METAINFO_PROPERTY)
  return (!metaInfo[API_METAINFO_DATES_PROPERTY]) ? undefined :
    rudiMetadata[API_METAINFO_PROPERTY][API_METAINFO_DATES_PROPERTY][API_DATES_CREATED_PROPERTY]

}

exports.setEditDateInRudiObject = async (rudiMetadata, editDate) => {
  const fun = 'setEditDateInRudiObject'
  log.d(mod, fun, ``)
  try {
    if (null == rudiMetadata) throw new Error(`${msg.parameterExpected(fun, 'rudiMetadata')}`)
    if (null == editDate) editDate == utils.nowISO()

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

function customMerger(a, b) {
  return _.isArray(b) ? b : undefined
}

// Parameter 'dbMetadata' gets mutated!
function metadataMerge(dbMetadata, dbReadyModMetadata) {
  const fun = 'customMerger'
  log.d(mod, fun, `dbMetadata: ${json.beautify(dbMetadata)}`)

  let dataDates = json.deepClone(dbMetadata[API_DATA_DATES_PROPERTY])
  let metaDates = json.deepClone(dbMetadata[API_METAINFO_PROPERTY][API_METAINFO_DATES_PROPERTY])
  log.d(mod, fun, `original data dates: ${json.beautify(dataDates)}`)
  log.d(mod, fun, `original meta dates: ${json.beautify(metaDates)}`)
  const modDataDates = dbReadyModMetadata[API_DATA_DATES_PROPERTY]
  const modMetaDates = (!dbReadyModMetadata[API_METAINFO_PROPERTY] ? {} : dbReadyModMetadata[API_METAINFO_PROPERTY][API_METAINFO_DATES_PROPERTY])

  _.extend(dataDates, modDataDates)
  _.extend(metaDates, modMetaDates)
  log.d(mod, fun, `modified data dates: ${json.beautify(dataDates)}`)
  log.d(mod, fun, `modified meta dates: ${json.beautify(metaDates)}`)

  _.mergeWith(dbMetadata, dbReadyModMetadata, customMerger)

  dbMetadata[API_DATA_DATES_PROPERTY] = dataDates
  dbMetadata[API_METAINFO_PROPERTY][API_METAINFO_DATES_PROPERTY] = metaDates

  log.d(mod, fun, `dbMetadata updated: ${json.beautify(dbMetadata)}`)
  return dbMetadata
}
//---------------------------------------------------------------
// Atomic treatments of properties: DB -> RUDI
//---------------------------------------------------------------

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

exports.mediaListDbToRudiFormat = async (mediaDbIds) => {
  const fun = 'mediaListDbToRudiFormat'
  log.d(mod, fun, ``)
  log.d(mod, fun, `mediaDbIds: ${json.beautify(mediaDbIds)}`)
  if (!mediaDbIds) throw new Error(`${msg.parameterExpected(fun, 'mediaDbIds')}`)

  let mediaList = []
  await Promise.all(mediaDbIds.map(
    async (mediaDbId) => {
      // log.d(mod, fun, `contactDbId: ${contactDbId}`)
      const dbMedia = await db.getEnsuredMediaWithDbId(mediaDbId)
      // contacts.push(dbRwk.unmongoosify(contact))
      mediaList.push(dbMedia)
      log.d(mod, fun, `${mediaDbId} -> ${json.beautify(dbMedia)}`)
    }));
  return mediaList
}

//---------------------------------------------------------------
// Global treatments of properties: RUDI -> DB
//---------------------------------------------------------------

/** 
 * Format a RUDI Metadata document (JSON):
 * @param rudiMetadata: the RUDI Metadata JSON object
 * @param shouldBeStrict: if required fields presence should be ensured (e.g. true for creation, false for update)
 * @param shouldClone: if original metadata should be cloned (== no more a db object)
 */
exports.rudiToDbFormat = async (rudiMetadata, shouldBeStrict, shouldClone) => {
  const fun = 'rudiToDbFormat'
  log.d(mod, fun, ``)

  if (!rudiMetadata) throw new Error(msg.parameterExpected(fun, 'rudiMetadata'))

  // let dbReadyMetadata = json.deepClone(rudiMetadata)
  let dbReadyMetadata
  if (shouldClone) {
    dbReadyMetadata = json.deepClone(rudiMetadata)
  } else {
    dbReadyMetadata = rudiMetadata
  }

  const SHOULD_CREATE_IF_NOT_FOUND = true
  // Flag that sets if organizations, contacts and media should be created 
  // if they don't already exist in the DB

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
      dbReadyMetadata[API_DATA_PRODUCER_PROPERTY] = await this.organizationRudiToDbFormat(producer, SHOULD_CREATE_IF_NOT_FOUND)
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
    if (utils.isNotEmptyArray(contacts)) {
      dbReadyMetadata[API_DATA_CONTACTS_PROPERTY] = await this.contactListRudiToDbFormat(contacts, SHOULD_CREATE_IF_NOT_FOUND)
    }
    // log.d(mod, fun, `objectData: ${json.beautify(objectData)}`)

    //----- Updating contacts field with db instead of incoming data
    // TODO[VALIDATE]: The contact info already in database is not updated with possible new data, 
    //                 and only the contact RUDI id is really necessary in the request body
    let mediaList
    if (shouldBeStrict) {
      mediaList = json.accessProperty(dbReadyMetadata, API_MEDIA_PROPERTY)
    } else {
      mediaList = dbReadyMetadata[API_MEDIA_PROPERTY]
    }
    log.d(mod, fun, `mediaList: ${json.beautify(mediaList)}`)
    if (utils.isNotEmptyArray(mediaList)) {
      dbReadyMetadata[API_MEDIA_PROPERTY] = await this.mediaListRudiToDbFormat(mediaList, SHOULD_CREATE_IF_NOT_FOUND)
    }
    // log.d(mod, fun, `media list: ${json.beautify(dbReadyMetadata[API_MEDIA_PROPERTY])}`)

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
      if (utils.isNotEmptyArray(metaInfoContacts)) {
        dbReadyMetadata[API_METAINFO_PROPERTY][API_METAINFO_CONTACTS_PROPERTY] = await this.contactListRudiToDbFormat(metaInfoContacts)
      }
    }
    // log.d(mod, fun, `dbReadyMetadata: ${json.beautify(dbReadyMetadata, 2)}`)
    return dbReadyMetadata
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}

//---------------------------------------------------------------
// Global treatments of properties: DB -> RUDI
//---------------------------------------------------------------

exports.dbMetadataToRudi = async (dbMetadata) => {
  const fun = 'dbToRudiMetadata'
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

  // Updating incoming data with the full info of each media
  // TODO[VALIDATE]: The media info already in database is not updated with possible new data, 
  //                 and only the media RUDI id is really necessary in the request body
  const mediaDbIds = json.accessProperty(rudiMetadata, API_MEDIA_PROPERTY)
  rudiMetadata[API_MEDIA_PROPERTY] = await this.mediaListDbToRudiFormat(mediaDbIds)

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
  if (utils.isNotEmptyArray(metaInfoContactsDbIds)) {
    cleanMetaInfo[API_METAINFO_CONTACTS_PROPERTY] = await this.contactListDbToRudiFormat(metaInfoContactsDbIds)
  }
  rudiMetadata[API_METAINFO_PROPERTY] = cleanMetaInfo
  // log.d(mod, fun, `rudiMetadata: ${json.beautify(rudiMetadata)}`)

  return rudiMetadata
}


exports.dbMetadataListToRudi = async (dbMetadataList) => {
  const fun = 'dbToRudiMetadataList'
  // log.d(mod, fun, ``)

  let rudiMetadataList = []
  await Promise.all(dbMetadataList.map(
    async (dbMetadata) => {
      const rudiMetadata = await this.dbMetadataToRudi(dbMetadata)
      rudiMetadataList.push(rudiMetadata)
    }
  ))
  return rudiMetadataList
}
//---------------------------------------------------------------
// High level actions
//---------------------------------------------------------------

exports.newMetadata = async (rudiMetadata) => {
  const fun = 'newMetadata'
  log.d(mod, fun, ``)
  // log.d(mod, fun, `incoming object: ${json.beautify(rudiMetadata)}`)
  if (!rudiMetadata) throw new Error(`${msg.parameterExpected(fun, 'rudiMetadata')}`)

  // Special treatment!
  let dbReadyObject = await this.rudiToDbFormat(rudiMetadata, true)

  // Special update for metadataInfo.referenceDates: update 'createdDate' 
  // this.setCreateDateInRudiObject(dbReadyObject)

  log.d(mod, fun, `DB ready object: ${json.beautify(dbReadyObject)}`)

  const dbMetadata = await new Metadata(dbReadyObject)
  
  dbMetadata.save()

  return this.dbMetadataToRudi(dbMetadata)
}

// parameter incomingRudiMetadata can be partial metadata
exports.updateMetadata = async (incomingRudiMetadata) => {
  const fun = 'updateMetadata'
  log.d(mod, fun, ``)

  if (null == incomingRudiMetadata) throw new Error(`${msg.parameterExpected(fun, 'incomingRudiMetadata')}`)
  log.d(mod, fun, `edited metadata: ${json.beautify(incomingRudiMetadata)}\n`)

  // ensure the metadata already exist
  const rudiId = json.accessProperty(incomingRudiMetadata, API_METADATA_ID)
  let dbMetadata = await db.getEnsuredMetadataWithRudiId(rudiId)
  log.v(mod, fun, `corresponding db object: ${json.beautify(dbMetadata)}\n`)

  let dbReadyEditedMetadata = await this.rudiToDbFormat(incomingRudiMetadata)
  log.v(mod, fun, `dbReadyEditedMetadata: ${json.beautify(dbReadyEditedMetadata)}\n`)

  // Backing up existing dates ('dataset_dates' and 'metadata_info.meadatada_dates' properties)

  metadataMerge(dbMetadata, dbReadyEditedMetadata)

  log.d(mod, fun, `modified metadata: ${json.beautify(dbMetadata)}`)

  dbMetadata.save()

  return this.dbMetadataToRudi(dbMetadata)
  /* 

  // Updating 'dataset_dates' field with changed ones while keeping other dates
  const updatedDataDates = dbReadyEditedMetadata[API_DATA_DATES_PROPERTY]
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
  const existingMetaDates = dbMetadata[API_METAINFO_PROPERTY][API_METAINFO_DATES_PROPERTY]
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
  log.d(mod, fun, `returned object: ${json.beautify(completeRudiMetadata)}`)

  return completeRudiMetadata
   */

}