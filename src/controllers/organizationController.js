import { accessReqParam } from '../utils/jsonAccess.js'

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
import { getOrganizationWithJson, searchOrganziations } from '../db/dbQueries.js'
import { Organization } from '../definitions/models/Organization.js'
import { RudiError } from '../utils/errors.js'
import {
  API_ORGANIZATION_ATTACHMENT_STATUS,
  API_ORGANIZATION_VALIDATION_STATUS,
} from '../db/dbFields.js'
import { isPortalConnectionDisabled } from '../config/confPortal.js'
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

  // If no portal is provided, then status not used
  if (isPortalConnectionDisabled()) return searchOrganziations()

  let organizationStatus = accessReqParam(req, API_ORGANIZATION_VALIDATION_STATUS)
  let linkedProducerStatus = accessReqParam(req, API_ORGANIZATION_ATTACHMENT_STATUS)
  return searchOrganziations(organizationStatus, linkedProducerStatus)
}
