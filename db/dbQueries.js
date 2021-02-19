//———————————————————————————————————————————————————————————————
// External dependancies 
//———————————————————————————————————————————————————————————————
const boom = require('@hapi/boom')

//———————————————————————————————————————————————————————————————
// Internal dependencies
//———————————————————————————————————————————————————————————————
const log = require('../utils/logging')
const msg = require('../utils/msg')
const {
  REQ_ID
} = require('../routes/apiUrl')

const {
  DB_ID,
  API_METADATA_ID,
  API_ORGANIZATION_ID,
  API_CONTACT_ID,
  API_PRODUCER_PROPERTY,
  API_CONTACTS_PROPERTY
} = require('../db/dbFields')

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
    if ('' == fullInfo) {
      throw new Error(`Object doesn't exist with ${labelIdField}: ${id}`)
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

//———————————————————————————————————————————————————————————————
// Access to specific fields
//———————————————————————————————————————————————————————————————

//----- Metadata
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

//----- Organization
exports.getOrganizationFromJson = async (organizationJson) => {
  const fun = 'getOrganizationFromJson'
  log.d(fun, ``)
  return this.getInfoFromJson(Organization, API_ORGANIZATION_ID, organizationJson)
}
exports.getOrganizationFromDbId = async (id) => {
  const fun = 'getOrganizationFromId'
  log.d(fun, ``)
  return this.getInfoFromDbId(Organization, id)
}

//----- Contacts
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