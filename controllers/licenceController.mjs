const mod = 'licenceCtrl'

// ------------------------------------------------------------------------------------------------
// External dependencies
// ------------------------------------------------------------------------------------------------
import { v4 as uuid } from 'uuid'
import { readFileSync } from 'fs'

// ------------------------------------------------------------------------------------------------
// Internal dependencies
// ------------------------------------------------------------------------------------------------
import { isEmptyArray } from '../utils/jsUtils.mjs'
import { logD, logT } from '../utils/logging.mjs'
import { cleanLicences, getAllConceptsWithRole, searchDbIdWithJson } from '../db/dbQueries.mjs'
import { dbConceptListToRudiRecursive, newSkosScheme } from './skosController.mjs'

import { InternalServerError, RudiError } from '../utils/errors.mjs'

import { API_SKOS_CONCEPT_CODE, LICENCE_CONCEPT_ROLE, API_LICENCE_LABEL } from '../db/dbFields.mjs'
import { OBJ_LICENCES } from '../config/confApi.mjs'

// ------------------------------------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------------------------------------

// ------------------------------------------------------------------------------------------------
// Controller
// ------------------------------------------------------------------------------------------------
// Cache for licences
let LICENCE_LIST, LICENCE_CODE_LIST

export const getLicences = async () => {
  const fun = 'getLicenceList'
  try {
    logT(mod, fun, ``)
    if (!LICENCE_LIST) {
      logD(mod, fun, `Init LICENCE_LIST`)
      let dblicenceList = await getAllConceptsWithRole(LICENCE_CONCEPT_ROLE)
      if (isEmptyArray(dblicenceList)) {
        await initializeLicences()
        dblicenceList = await getAllConceptsWithRole(LICENCE_CONCEPT_ROLE)
      }
      LICENCE_LIST = await dbConceptListToRudiRecursive(dblicenceList)
    }
    return LICENCE_LIST
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

export const getLicenceCodes = async () => {
  const fun = `getLicenceCodes`
  try {
    logT(mod, fun, ``)
    if (!LICENCE_CODE_LIST) {
      const licenceList = await getLicences()
      const licenceCodeList = licenceList.map((obj) => obj[API_SKOS_CONCEPT_CODE])
      LICENCE_CODE_LIST = licenceCodeList.sort()
    }
    return LICENCE_CODE_LIST
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

export const initializeLicences = async () => {
  const fun = 'initializeLicences'
  try {
    await cleanLicences()
    LICENCE_CODE_LIST = null
    logD(mod, fun, `Licences initialized`)
    const licenceStr = JSON.stringify(readFileSync('../doc/api/licences.json'))
    const licenceData = JSON.parse(licenceStr.replace(/\{\{\w+\}\}/g, () => uuid()))
    // logD(mod, fun, licenceData)
    const reply = await newSkosScheme(licenceData)
    if (!reply) throw new InternalServerError(`Licence integration failed`)
    return await getLicenceCodes()
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

export const getLicenceWithCode = async (licenceCode) => {
  return await searchDbIdWithJson(OBJ_LICENCES, { [API_LICENCE_LABEL]: licenceCode })
}

// ------------------------------------------------------------------------------------------------
// Controller
// ------------------------------------------------------------------------------------------------
export const getAllLicences = async (req, reply) => {
  const fun = `getAllLicences`
  logT(mod, fun, `< ${req?.method} ${req?.url}`)
  // logT(mod, fun, ``)

  return await getLicences()
}

export const getAllLicenceCodes = async (req, reply) => {
  const fun = `getAllLicenceCodes`
  logT(mod, fun, `< ${req?.method} ${req?.url}`)
  // logT(mod, fun, ``)

  return await getLicenceCodes()
}

export const initLicences = async (req, reply) => {
  const fun = `initLicences`
  logT(mod, fun, `< ${req?.method} ${req?.url}`)
  return await initializeLicences()
}
