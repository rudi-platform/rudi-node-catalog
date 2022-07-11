const mod = 'orgCtrl'
/*
 * This file describes the steps followed for each
 * action on the organizations (producer or publisher)
 */

// ------------------------------------------------------------------------------------------------
// External dependencies
// ------------------------------------------------------------------------------------------------
import { logT } from '../utils/logging.mjs'
import { beautify } from '../utils/jsUtils.mjs'

// ------------------------------------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------------------------------------

// ------------------------------------------------------------------------------------------------
// Data models
// ------------------------------------------------------------------------------------------------
import { Organization } from '../definitions/models/Organization.mjs'
import { RudiError } from '../utils/errors.mjs'
// import cache from '../db/dbCache'

// ------------------------------------------------------------------------------------------------
// Functions
// ------------------------------------------------------------------------------------------------
export const newOrganization = async (orgJson) => {
  const fun = 'newOrganization'
  logT(mod, fun, beautify(orgJson))

  let dbOrganization

  try {
    dbOrganization = await new Organization(orgJson)
    await dbOrganization.save()
    // cache.addOrganization(dbOrganization)
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
  return dbOrganization
}
