'use strict'

const mod = 'contCtrl'
/*
 * In this file are made the different steps followed for each
 * action on the contacts (producer or publisher)
 */

// ---------------------------------------------------------------
// Internal dependancies
// ---------------------------------------------------------------
const log = require('../utils/logging')
const json = require('../utils/jsonAccess')

// ---------------------------------------------------------------
// Constants
// ---------------------------------------------------------------
const {
  URL_OBJECT_CONTACTS
} = require('../config/confApi')

// ---------------------------------------------------------------
// Data models
// ---------------------------------------------------------------
const Contact = require('../definitions/models/Contact')

// ---------------------------------------------------------------
// Controller functions
// ---------------------------------------------------------------
exports.newContact = async (contactJson) => {
  const fun = 'newContact'
  log.d(mod, fun, ``)
  let dbContact
  try {
    dbContact = await new Contact(contactJson)
  } catch (err) {
    log.w(mod, fun, `New object '${URL_OBJECT_CONTACTS}': ${utils.beautify(contactJson)} | Error: ${err}`)
    throw err
  }
  try {
    await dbContact.save()
  } catch (err) {
    log.w(mod, fun, `Saving object '${URL_OBJECT_CONTACTS}': ${utils.beautify(dbContact)} | Error: ${err}`)
    throw err
  }
  return dbContact
}
