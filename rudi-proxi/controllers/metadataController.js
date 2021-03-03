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
// Controllers
//———————————————————————————————————————————————————————————————

// Add a new metadata
exports.addMetadata = async (req, reply) => {
  const fun = 'addMetadata'
  log.d(fun, ``)
  try {
    lang.setLanguage(req.params[REQ_LANG])

    /* beautify ignore:start */
    let incomingData = {...req.body}
    /* beautify ignore:end */

    const id = json.accessProperty(incomingData, API_METADATA_ID)

    // First: we make sure id isn't used already
    if (await db.doesInfoExistFromRudiId(Metadata, API_METADATA_ID, id)) {
      throw new Error(`${msg.metadataAlreadyExists(id)}`)
    }

    const producer = json.accessProperty(incomingData, API_PRODUCER_PROPERTY)
    const contacts = json.accessProperty(incomingData, API_CONTACTS_PROPERTY)

    // Updating incoming data with the full info of the organization
    // TODO[VALIDATE]: The organization info already in database is not updated with possible new data, 
    //                 and only the organization RUDI id is really necessary in the request body    
    incomingData[API_PRODUCER_PROPERTY] = await dbRwk.updateJsonOrganization(producer)

    // Updating incoming data with the full info of the organization
    // TODO[VALIDATE]: The contact info already in database is not updated with possible new data, 
    //                 and only the contact RUDI id is really necessary in the request body
    incomingData[API_CONTACTS_PROPERTY] = await dbRwk.updateJsonContactList(contacts)

    // Creating new metadata
    const newMetadata = new Metadata(incomingData)
    const metadata = await newMetadata.save()
    log.d(fun, `${msg.metadataAdded(incomingData[API_METADATA_ID])}`)
    return metadata
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

// Get all metadata
exports.getEveryMetadata = async (req, reply) => {
  const fun = 'getEveryMetadata'
  log.d(fun, ``)

  try {
    lang.setLanguage(req.params[REQ_LANG])

    const metadataList = await db.getAllMetadata()
    // log.d(fun, `metadataList: ${metadataList}`)

    const updatedMetadataList = await dbRwk.updateMetadataListPropertiesFromDb(metadataList)
    return updatedMetadataList
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

// Get single metadata by ID
exports.getSingleMetadata = async (req, reply) => {
  const fun = 'getSingleMetadata'
  log.d(fun, ``)

  try {
    lang.setLanguage(json.accessParam(req.params, REQ_LANG))

    // Checking if the parameter is ok
    const id = json.accessParam(req.params, REQ_ID)

    let metadata = await db.getMetadataFromRudiId(id)

    // If the metadata doesn't exist in the db => error
    if (!metadata || '' == metadata) {
      throw new Error(`${msg.metadataNotFound(id)}`)
    }

    let updatedMetadata = await dbRwk.updateMetadataPropertiesFromDb(metadata)

    log.d(fun, msg.metadataUpdated(id))

    return updatedMetadata
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

// Update an existing metadata
exports.updateMetadata = async (req, reply) => {
  const fun = 'updateMetadata'
  log.d(fun, ``)
  try {
    lang.setLanguage(json.accessParam(req.params, REQ_LANG))

    /* beautify ignore:start */
    let incomingData = {...req.body}
    /* beautify ignore:end */

    const id = json.accessProperty(incomingData, API_METADATA_ID)

    // First: we make sure some data exists with input JSON id
    const existingMetadata = await db.getMetadataFromJson(incomingData)
    if (!existingMetadata || '' == existingMetadata) {
      throw new Error(`${msg.metadataNotFound(id)}`)
    }

    const producer = json.accessProperty(incomingData, API_PRODUCER_PROPERTY)
    const contacts = json.accessProperty(incomingData, API_CONTACTS_PROPERTY)

    // TODO[VALIDATE]: this means only the RUDI id for the contact is necessary (and taken into account)
    incomingData[API_PRODUCER_PROPERTY] = await db.getOrganizationFromJson(producer)

    // TODO[VALIDATE]: the contact info already in database is not updated with possible new data
    // TODO[VALIDATE]: this means only the RUDI id for the contact is necessary (and taken into account)
    incomingData[API_CONTACTS_PROPERTY] = await dbRwk.updateJsonContactList(contacts)

    const updatedMetadata = await db.updateInfo(Metadata, API_METADATA_ID, incomingData)

    log.d(fun, msg.metadataUpdated(id))
    return updatedMetadata
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

// Delete a metadata
exports.deleteMetadata = async (req, reply) => {
  const fun = 'deleteMetadata'
  log.d(fun, ``)
  try {
    lang.setLanguage(json.accessParam(req.params, REQ_LANG))

    const id = json.accessParam(req.params, REQ_ID)

    const deletedMetadata = await db.deleteMetadata(id)

    // log.d(fun, msg.metadataDeleted(id))
    return deletedMetadata
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }

}

// Delete every metadata
exports.deleteManyMetadata = async (req, reply) => {
  const fun = 'deleteManyMetadata'
  log.d(fun, ``)
  try {
    lang.setLanguage(json.accessParam(req.params, REQ_LANG))

    /* beautify ignore:start */
    const {...conditions} = req.body
    /* beautify ignore:end */
    
    log.d(fun, conditions)
    const actionReturn = await Metadata.deleteMany(conditions)
    log.d(fun, msg.metadataDeletedWithCondition(conditions))
    log.d(fun, `actionReturn: ${actionReturn}`)
    return actionReturn
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }

}