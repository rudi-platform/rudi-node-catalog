'use strict'

const mod = 'orgCtrl'
/*
 * This file describes the steps followed for each
 * action on the organizations (producer or publisher)
 */

// ------------------------------------------------------------------------------------------------
// External dependancies
// ------------------------------------------------------------------------------------------------
const log = require('../utils/logging')
const utils = require('../utils/jsUtils')

// ------------------------------------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------------------------------------

const { PARAM_OBJECT_ORGANIZATIONS: URL_OBJECT_ORGANIZATIONS } = require('../config/confApi')

// ------------------------------------------------------------------------------------------------
// Data models
// ------------------------------------------------------------------------------------------------
const Organization = require('../definitions/models/Organization')
// const cache = require('../db/dbCache')

exports.newOrganization = async (orgJson) => {
  const fun = 'newOrganization'
  log.d(mod, fun, `${utils.beautify(orgJson)}`)

  let dbOrganization

  try {
    dbOrganization = await new Organization(orgJson)
  } catch (err) {
    log.w(
      mod,
      fun,
      `New object '${URL_OBJECT_ORGANIZATIONS}': ${utils.beautify(orgJson)} | Error: ${err}`
    )
    // log.e(mod, fun, err)
    throw err
  }
  try {
    await dbOrganization.save()
    // cache.addOrganization(dbOrganization)
  } catch (err) {
    log.w(
      mod,
      fun,
      `Saving object '${URL_OBJECT_ORGANIZATIONS}': ${utils.beautify(
        dbOrganization
      )} | Error: ${err}`
    )
    // log.e(mod, fun, err)
    throw err
  }
  return dbOrganization
}
