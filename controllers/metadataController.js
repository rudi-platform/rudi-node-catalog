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

    const id = incomingData[API_METADATA_ID]
    if (!id || '' == id) {
      throw new Error(`${msg.missingProperty(incomingData, API_METADATA_ID)}`)
    }

    // First: we make sure id isn't used already
    const existingMetadata = await db.getMetadataFromJson(incomingData)
    if (existingMetadata && '' != existingMetadata) {
      throw new Error(`${msg.metadataAlreadyExists(id)}`)
    }

    // Updating incoming data with the full info of the organization
    // TODO[VALIDATE]: The organization info already in database is not updated with possible new data, 
    //                 and only the organization RUDI id is really necessary in the request body
    incomingData[API_PRODUCER_PROPERTY] = await dbRwk.updateJsonOrganization(incomingData[API_PRODUCER_PROPERTY])


    // Updating incoming data with the full info of the organization
    // TODO[VALIDATE]: The contact info already in database is not updated with possible new data, 
    //                 and only the contact RUDI id is really necessary in the request body
    incomingData[API_CONTACTS_PROPERTY] = await dbRwk.updateJsonContactList(incomingData[API_CONTACTS_PROPERTY])

    // Creating new metadata
    const newMetadata = new Metadata(incomingData)
    const dbActionresult = await newMetadata.save()
    log.d(fun, `${msg.metadataAdded(incomingData[API_METADATA_ID])}`)
    return dbActionresult
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
    lang.setLanguage(req.params[REQ_LANG])

    // Checking if the parameter is ok
    const id = req.params[REQ_ID]
    if (!id || '' == id) {
      throw new Error(`${msg.parameterExpected(REQ_ID)}`)
    }

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
    lang.setLanguage(req.params[REQ_LANG])

    /* beautify ignore:start */
    let incomingData = {...req.body}
    /* beautify ignore:end */

    const id = incomingData[API_METADATA_ID]
    if (!id || '' == id) {
      throw new Error(`Body should define the property '${API_METADATA_ID}'`)
    }

    // First: we make sure some data exists with input JSON id
    const existingMetadata = await db.getMetadataFromJson(incomingData)
    if (!existingMetadata || '' == existingMetadata) {
      throw new Error(`${msg.metadataNotFound(id)}`)
    }

    // Retrieveing full info for the organization
    if (!incomingData[API_PRODUCER_PROPERTY] || '' == incomingData[API_PRODUCER_PROPERTY]) {
      throw new Error(`${msg.missingProperty( incomingData, API_PRODUCER_PROPERTY)}`)
    }
    // TODO[VALIDATE]: this means only the RUDI id for the contact is necessary (and taken into account)
    incomingData[API_PRODUCER_PROPERTY] = await db.getOrganizationFromJson(incomingData[API_PRODUCER_PROPERTY])

    // TODO[VALIDATE]: the contact info already in database is not updated with possible new data
    // TODO[VALIDATE]: this means only the RUDI id for the contact is necessary (and taken into account)
    incomingData[API_CONTACTS_PROPERTY] = await dbRwk.updateJsonContactList(incomingData[API_CONTACTS_PROPERTY])

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
    lang.setLanguage(req.params[REQ_LANG])

    const id = req.params[REQ_ID]
    const metadata = await Metadata.findOneAndRemove({
      [API_METADATA_ID]: id
    })
    if (null == metadata) {
      throw new Error(msg.metadataNotFound(id))
    }
    log.d(fun, msg.metadataDeleted(id))
    return metadata
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
    lang.setLanguage(req.params[REQ_LANG])

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