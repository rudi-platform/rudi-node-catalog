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
const { beautify } = require('../utils/jsUtils')

// ------------------------------------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------------------------------------

const { PARAM_OBJECT_ORGANIZATIONS: URL_OBJECT_ORGANIZATIONS } = require('../config/confApi')

// ------------------------------------------------------------------------------------------------
// Data models
// ------------------------------------------------------------------------------------------------
const Organization = require('../definitions/models/Organization')
const { treatError } = require('../utils/errors')
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
    throw treatError(err, { mod: mod, fun: fun })
  }
  try {
    await dbOrganization.save()
    // cache.addOrganization(dbOrganization)
  } catch (err) {
    const errMsg = `Saving object '${URL_OBJECT_ORGANIZATIONS}': ${beautify(
      dbOrganization
    )} | Error: ${err}`
    log.w(mod, fun, errMsg)
    throw treatError(err, { mod: mod, fun: fun })
  }
  return dbOrganization
}
