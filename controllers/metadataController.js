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

//———————————————————————————————————————————————————————————————
// Helping functions
//———————————————————————————————————————————————————————————————
const organizationController = require('./organizationController')

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
async function updateOrganizationJson(organizationJson) {
  const fun = 'updateOrganizationJson'
  log.d(fun, `organizationJson: ${organizationJson}`)

  // Retrieveing full info for the organization
  const producerInfo = await db.getOrganizationFromJson(organizationJson)

  // TODO[VALIDATE]: we assume the organization has previously been created!
  if ('' == producerInfo) {
    throw new Error(`${msg.organizationNotFound(organizationJson[API_ORGANIZATION_ID])}`)
  }

  return producerInfo
}

async function updateContactJson(contactJson) {
  const fun = 'updateContactJson'
  log.d(fun, ``)
  let updatedContact = await db.getContactFromJson(contactJson)

  // TODO[VALIDATE]: we assume the contact has previously been created!
  if ('' == updatedContact) {
    throw new Error(`${msg.contactNotFound(contactsJson[API_CONTACT_ID])}`)
  }

  return updatedContact
}

async function updateContactListJson(contactsJson) {
  const fun = 'updateContactListJson'
  log.d(fun, ``)

  // Retrieveing full info for the contacts
  let fullContacts = []
  for (const contact of contactsJson) {
    fullContacts.push(await updateContactJson(contact))
  }

  return fullContacts
}

async function updateMetadataPropertiesFromDb(metadata) {
  const fun = 'updateMetadataProperties'
  log.d(fun, `metadata: ${metadata}`)

  /* beautify ignore:start */
  let updatedMetadata = metadata;
  /* beautify ignore:end */

  //————— Updating Producer info
  // Note : here we are updating data as they are stored in DB
  //        So 'producer' field is in reality a producer mongo _id!
  const producerId = metadata[API_PRODUCER_PROPERTY]
  const updatedProducer = await db.getOrganizationFromDbId(producerId)
  if ('' == updatedProducer) {
    throw new Error(`${msg.organizationNotFound(producerId)}`)
  }

  //————— Updating Contacts info
  // Note : here we are updating data as they are stored in DB
  //        So 'contacts' field is actually an array of contact mongo _ids!
  const contacts = metadata[API_CONTACTS_PROPERTY]

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

async function updateMetadataListPropertiesFromDb(metadataList) {
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

    // First: we make sure id isn't used already
    const existingMetadata = await db.getMetadataFromJson(incomingData)
    if (null != existingMetadata && '' != existingMetadata) {
      throw new Error(`${msg.metadataAlreadyExists(incomingData[API_METADATA_ID])}`)
    }

    // Updating incoming data with the full info of the organization
    // TODO[VALIDATE]: The organization info already in database is not updated with possible new data, 
    //                 and only the organization RUDI id is really necessary in the request body
    incomingData[API_PRODUCER_PROPERTY] = await updateOrganizationJson(incomingData[API_PRODUCER_PROPERTY])


    // Updating incoming data with the full info of the organization
    // TODO[VALIDATE]: The contact info already in database is not updated with possible new data, 
    //                 and only the contact RUDI id is really necessary in the request body
    incomingData[API_CONTACTS_PROPERTY] = await updateContactListJson(incomingData[API_CONTACTS_PROPERTY])

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
  lang.setLanguage(req.params[REQ_LANG])

  try {
    const metadataList = await db.getAllMetadata()
    // log.d(fun, `metadataList: ${metadataList}`)

    const updatedMetadataList = await updateMetadataListPropertiesFromDb(metadataList)
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
    if ('' == id) {
      throw new Error(`${msg.parameterExpected(REQ_ID)}`)
    }

    let metadata = await db.getMetadataFromRudiId(id)

    // If the metadata doesn't exist in the db => error
    if ('' == metadata) {
      throw new Error(`${msg.metadataNotFound(id)}`)
    }

    log.d(fun, `found metadata with id ${id}:\n${metadata}`)

    let updatedMetadata = await updateMetadataPropertiesFromDb(metadata)

    log.d(fun, `updated metadata:\n${updatedMetadata}`)

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
    if ('' == id) {
      throw new Error(`Body should define the property '${API_METADATA_ID}'`)
    }

    // First: we make sure some data exists with input JSON id
    const existingMetadata = await Metadata.find({
      [API_METADATA_ID]: id
    })
    if ('' == existingMetadata) {
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
    incomingData[API_CONTACTS_PROPERTY] = await updateContactListJson(incomingData[API_CONTACTS_PROPERTY])

    const updatedMetadata = await Metadata.findOneAndUpdate({
      [API_METADATA_ID]: id
    }, incomingData, {
      new: true
    })

    if (null == updatedMetadata) {
      const errMsg = `couldn't find metadata with id ${id}`
      err = new Error(errMsg)
      throw boom.boomify(err)
    }
    log.d(fun, `updated metadata with id ${id}`)
    return incomingData
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
    const id = req.params[REQ_ID]
    const metadata = await Metadata.findOneAndRemove({
      [API_METADATA_ID]: id
    })
    if (null == metadata) {
      throw new Error(`couldn't find metadata with id ${id}`)
    }
    log.d(fun, `deleted metadata with id ${id})`)
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
    const {
      ...conditions
    } = req.body
    log.d(fun, conditions)
    const metadata = await Metadata.deleteMany(conditions)
    log.d(fun, `deleted metadata with condition ${conditions})`)
    return metadata
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }

}