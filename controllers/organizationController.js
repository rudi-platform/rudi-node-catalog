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
const { beautify, treatAndSendError } = require('../utils/jsUtils')

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
  log.d(mod, fun, `${beautify(orgJson)}`)

  let dbOrganization

  try {
    dbOrganization = await new Organization(orgJson)
  } catch (err) {
    const errMsg = `New object '${URL_OBJECT_ORGANIZATIONS}': ${beautify(orgJson)} | Error: ${err}`
    log.w(mod, fun, errMsg)
    treatAndSendError(err, { mod: mod, fun: fun, err: err })
    throw err
  }
  try {
    await dbOrganization.save()
    // cache.addOrganization(dbOrganization)
  } catch (err) {
    const errMsg = `Saving object '${URL_OBJECT_ORGANIZATIONS}': ${beautify(
      dbOrganization
    )} | Error: ${err}`
    log.w(mod, fun, errMsg)
    treatAndSendError(err, { mod: mod, fun: fun, err: err })
    throw err
  }
  return dbOrganization
}
