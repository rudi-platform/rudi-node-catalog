'use strict'

const mod = 'contCtrl'
/*
 * In this file are made the different steps followed for each
 * action on the contacts (producer or publisher)
 */

// ------------------------------------------------------------------------------------------------
// Internal dependancies
// ------------------------------------------------------------------------------------------------
const log = require('../utils/logging')
const { beautify } = require('../utils/jsUtils')
const { RudiError, InternalServerError } = require('../utils/errors')

// ------------------------------------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------------------------------------
const { OBJ_CONTACTS } = require('../config/confApi')

// ------------------------------------------------------------------------------------------------
// Data models
// ------------------------------------------------------------------------------------------------
const { Contact } = require('../definitions/models/Contact')

// ------------------------------------------------------------------------------------------------
// Controller functions
// ------------------------------------------------------------------------------------------------
exports.newContact = async (contactJson) => {
  const fun = 'newContact'
  log.d(mod, fun, `${beautify(contactJson)}`)
  let dbContact
  try {
    dbContact = await new Contact(contactJson)
  } catch (err) {
    const error = new InternalServerError(
      `New object '${OBJ_CONTACTS}': ${beautify(contactJson)} | Error: ${err}`
    )
    throw RudiError.treatError(mod, fun, error)
  }
  try {
    await dbContact.save()
  } catch (err) {
    const error = new InternalServerError(
      `Saving object '${OBJ_CONTACTS}': ${beautify(dbContact)} | Error: ${err}`
    )
    throw RudiError.treatError(mod, fun, error)
  }
  return dbContact
}
