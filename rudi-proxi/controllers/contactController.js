/*
 * In this file are made the different steps followed for each 
 * action on the contacts (producer or publisher)
 */

 //———————————————————————————————————————————————————————————————
// External dependancies 
//———————————————————————————————————————————————————————————————
const boom = require('@hapi/boom')
const log = require('../utils/logging')
const msg = require('../utils/msg')

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
const Contact = require('../definitions/models/Contact')

//———————————————————————————————————————————————————————————————
// Controllers
//———————————————————————————————————————————————————————————————

// Add a new contact
exports.addContact = async (req, reply) => {
  const fun = 'addContact'
  log.d(fun, ``)
  try {
    /* beautify ignore:start */
    let incomingData = {...req.body}
    /* beautify ignore:end */

    const id = json.accessProperty(incomingData, API_CONTACT_ID)


    // First: we make sure id isn't used already
    const existingContact = await db.getContactFromRudiId(id)
    if (existingContact && '' != existingContact) {
      throw new Error(`${msg.contactAlreadyExists(id)}`)
    }

    // Creating new contact
    const newContact = new Contact(incomingData)
    const dbActionResult = await newContact.save()
    log.d(fun, `${msg.contactAdded(id)}`)
    return dbActionResult
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

// Get all contact
exports.getEveryContact = async (req, reply) => {
  const fun = 'getEveryContact'
  log.d(fun, ``)
  try {
    const contact = await db.getAllContacts()
    return contact
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

// Get single contact by ID
exports.getSingleContact = async (req, reply) => {
  const fun = 'getSingleContact'
  log.d(fun, ``)
  try {
    const id = req.params[REQ_ID]
    if (!id || '' == id) {
      throw new Error(`${msg.parameterExpected(REQ_ID)}`)
    }

    const contact = await db.getContactFromRudiId(id)

    if (!contact || '' == contact) {
      throw new Error(`${msg.contactNotFound(id)}`)
    }

    return contact
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

// Update an existing contact
exports.updateContact = async (req, reply) => {
  const fun = 'updateContact'
  log.d(fun, ``)
  try {
    /* beautify ignore:start */
    const {...incomingData} = req.body
    /* beautify ignore:end */

    return await db.updateContact(incomingData)

  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

// Delete a contact
exports.deleteContact = async (req, reply) => {
  const fun = 'deleteContact'
  log.d(fun, ``)
  try {
    const id = req.params[REQ_ID]
    if (!id || '' == id) {
      throw new Error(`${msg.parameterExpected(fun, REQ_ID)}`)
    }

    const deletedContact = db.deleteContact(id)

    return deletedContact
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }

}

// Delete every contact
exports.deleteManyContact = async (req, reply) => {
  const fun = 'deleteManyContact'
  log.d(fun, ``)
  try {
    const {
      ...conditions
    } = req.body
    log.d(fun, conditions)
    const contact = await Contact.deleteMany(conditions)
    log.d(fun, `deleted contact with condition ${conditions})`)
    return contact
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }

}