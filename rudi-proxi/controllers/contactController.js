'use strict'

const mod = 'contCtrl'
/*
 * In this file are made the different steps followed for each
 * action on the contacts (producer or publisher)
 */

// ---------------------------------------------------------------
// External dependancies
// ---------------------------------------------------------------
const boom = require('@hapi/boom')
const log = require('../utils/logging')
const msg = require('../utils/msg')

const db = require('../db/dbQueries')
const dbRwk = require('../db/dbReworkData')
const json = require('../utils/jsonAccess')
// ---------------------------------------------------------------
// Constants
// ---------------------------------------------------------------
const {
  DB_ID,
  API_METADATA_ID,
  API_ORGANIZATION_ID,
  API_CONTACT_ID,
  API_DATA_PRODUCER_PROPERTY: API_PRODUCER_PROPERTY,
  API_DATA_CONTACTS_PROPERTY: API_CONTACTS_PROPERTY
} = require('../db/dbFields')

const {
  PARAM_LANG: REQ_LANG,
  PARAM_ID: REQ_ID,
  URL_OBJECT_CONTACTS
} = require('../config/confApi')

// ---------------------------------------------------------------
// Data models
// ---------------------------------------------------------------
const Contact = require('../definitions/models/Contact')

exports.newContact = async (contactJson) => {
  const fun = 'newContact'
  log.d(mod, fun, ``)
  let dbContact
  try {
    dbContact = await new Contact(contactJson)
  } catch (err) {
    log.w(mod, fun, `New object '${URL_OBJECT_CONTACTS}': ${json.beautify(contactJson)} | Error: ${err}`)
    throw err
  }
  try {
    await dbContact.save()
  } catch (err) {
    log.w(mod, fun, `Saving object '${URL_OBJECT_CONTACTS}': ${json.beautify(dbContact)} | Error: ${err}`)
    throw err
  }
  return dbContact
}
