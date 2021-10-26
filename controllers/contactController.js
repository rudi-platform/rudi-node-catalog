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
const { beautify, treatAndSendError } = require('../utils/jsUtils')

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
    const errMsg = `New object '${URL_OBJECT_CONTACTS}': ${beautify(contactJson)} | Error: ${err}`
    log.w(mod, fun, errMsg)
    treatAndSendError(err, { mod: mod, fun: fun, err: errMsg })
    throw err
  }
  try {
    await dbContact.save()
  } catch (err) {
    const errMsg = `Saving object '${URL_OBJECT_CONTACTS}': ${beautify(dbContact)} | Error: ${err}`
    log.w(mod, fun, errMsg)
    treatAndSendError(err, { mod: mod, fun: fun, err: errMsg })
    throw err
  }
  return dbContact
}
