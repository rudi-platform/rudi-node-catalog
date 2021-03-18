'use strict';

const mod = 'dbCtrl'
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
  API_DATA_PRODUCER_PROPERTY,
  API_DATA_CONTACTS_PROPERTY
} = require('../db/dbFields')

const {
  PARAM_ID, URL_DB_ACCESS
} = require('../config/confApi')

const {
  DB_NAME
} = require('../config/confSystem')


//———————————————————————————————————————————————————————————————
// Controllers
//———————————————————————————————————————————————————————————————

exports.getCollections = async (req, reply) => {
  const fun = 'getCollections'
  log.d(mod, fun, `< GET ${URL_DB_ACCESS}`)
  try {

    const dbActionResult = await db.getCollections(DB_NAME)
    return dbActionResult

  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}
exports.dropDB = async (req, reply) => {
  const fun = 'dropDB'
  log.d(mod, fun, `< DELETE ${URL_DB_ACCESS}`)
  try {

    const dbActionResult = await db.dropDB(DB_NAME)
    return dbActionResult

  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}