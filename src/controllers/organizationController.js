const mod = 'orgCtrl'
/*
 * This file describes the steps followed for each
 * action on the organizations (producer or publisher)
 */

// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import { beautify } from '../utils/jsUtils.js'
import { logT } from '../utils/logging.js'

// -------------------------------------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------------------------------------

// -------------------------------------------------------------------------------------------------
// Data models
// -------------------------------------------------------------------------------------------------
import { isPortalConnectionDisabled } from '../config/confPortal.js'
import { OBJ_ORGANIZATIONS } from '../config/constApi.js'
import {
  API_ORGANIZATION_ATTACHMENT_STATUS,
  API_ORGANIZATION_VALIDATION_STATUS,
} from '../db/dbFields.js'
import { dbSearchOrganizations, getOrganizationWithJson } from '../db/dbQueries.js'
import { Organization } from '../definitions/models/Organization.js'
import { RudiError } from '../utils/errors.js'
import { getManyObjects } from './genericController.js'
// import cache from '../db/dbCache'

// -------------------------------------------------------------------------------------------------
// Functions
// -------------------------------------------------------------------------------------------------
export const newOrganization = async (orgJson) => {
  const fun = 'newOrganization'
  logT(mod, fun, beautify(orgJson))
  try {
    const org = await getOrganizationWithJson(orgJson)
    if (!!org) return org

    const dbOrganization = new Organization(orgJson)
    await dbOrganization.save()
    return dbOrganization
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

export const searchOrganizations = async (req, reply) => {
  const fun = 'searchOrganizations'
  logT(mod, fun)

  // Keep the generic behavior when portal is not configured.
  if (isPortalConnectionDisabled()) return getManyObjects(OBJ_ORGANIZATIONS, req)

  const organizationStatus =
    req?.query?.[API_ORGANIZATION_VALIDATION_STATUS] ??
    req?.params?.[API_ORGANIZATION_VALIDATION_STATUS]
  const linkedProducerStatus =
    req?.query?.[API_ORGANIZATION_ATTACHMENT_STATUS] ??
    req?.params?.[API_ORGANIZATION_ATTACHMENT_STATUS]
  return dbSearchOrganizations(organizationStatus, linkedProducerStatus)
}
