'use strict'

const mod = 'orgCtrl'
/*
 * This file describes the steps followed for each
 * action on the organizations (producer or publisher)
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
  API_DATA_PRODUCER_PROPERTY,
  API_DATA_CONTACTS_PROPERTY
} = require('../db/dbFields')

const {
  PARAM_LANG: REQ_LANG,
  PARAM_ID: REQ_ID,
  URL_OBJECT_ORGANIZATIONS
} = require('../config/confApi')

// ---------------------------------------------------------------
// Data models
// ---------------------------------------------------------------
const Organization = require('../definitions/models/Organization')
// const cache = require('../db/dbCache')

exports.newOrganization = async (orgJson) => {
  const fun = 'newOrganization'
  log.d(mod, fun, ``)

  let dbOrganization

  try {
    dbOrganization = await new Organization(orgJson)
  } catch (err) {
    log.w(mod, fun, `New object '${URL_OBJECT_ORGANIZATIONS}': ${json.beautify(orgJson)} | Error: ${err}`)
    log.e(mod, fun, err)
    throw err
  }
  try {
    await dbOrganization.save()
    // cache.addOrganization(dbOrganization)
  } catch (err) {
    log.w(mod, fun, `Saving object '${URL_OBJECT_ORGANIZATIONS}': ${json.beautify(dbOrganization)} | Error: ${err}`)
    log.e(mod, fun, err)
    throw err
  }
  return dbOrganization
}
