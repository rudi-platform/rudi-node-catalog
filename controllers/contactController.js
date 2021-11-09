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
const { treatError, InternalServerError } = require('../utils/errors')

// ------------------------------------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------------------------------------
const { PARAM_OBJECT_CONTACTS: URL_OBJECT_CONTACTS } = require('../config/confApi')

// ------------------------------------------------------------------------------------------------
// Data models
// ------------------------------------------------------------------------------------------------
const Contact = require('../definitions/models/Contact')

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
      `New object '${URL_OBJECT_CONTACTS}': ${beautify(contactJson)} | Error: ${err}`
    )
    throw treatError(error, { mod: mod, fun: fun })
  }
  try {
    await dbContact.save()
  } catch (err) {
    const error = new InternalServerError(
      `Saving object '${URL_OBJECT_CONTACTS}': ${beautify(dbContact)} | Error: ${err}`
    )
    throw treatError(error, { mod: mod, fun: fun })
  }
  return dbContact
}
