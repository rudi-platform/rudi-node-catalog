const mod = 'licenceCtrl'

// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import { v4 as uuid } from 'uuid'
// -------------------------------------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------------------------------------
import { OBJ_LICENCES } from '../config/constApi.js'
import { API_LICENCE_LABEL, API_SKOS_CONCEPT_CODE, LICENCE_CONCEPT_ROLE } from '../db/dbFields.js'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { cleanLicences, getAllConceptsWithRole, searchDbIdWithJson } from '../db/dbQueries.js'
import { InternalServerError, RudiError } from '../utils/errors.js'
import { isEmptyArray } from '../utils/jsUtils.js'
import { logD, logT } from '../utils/logging.js'
import { dbConceptListToRudiRecursive, newSkosScheme } from './skosController.js'

import {
  get as getLicenceCodeList,
  initialize as initLicenceCodes,
  setAll as setLicenceCodes,
} from '../definitions/thesaurus/LicenceCodes.js'

import licenceScheme from '../../doc/api/licences.js'
import { accessProperty } from '../utils/jsonAccess.js'

// -------------------------------------------------------------------------------------------------
// Controller
// -------------------------------------------------------------------------------------------------
// Cache for licences
let LICENCE_LIST

export const getLicences = async () => {
  const fun = 'getLicenceList'
  try {
    logT(mod, fun)
    if (!LICENCE_LIST) {
      logD(mod, fun, `Init LICENCE_LIST`)
      let dbLicenceList = await getAllConceptsWithRole(LICENCE_CONCEPT_ROLE)
      if (isEmptyArray(dbLicenceList)) {
        await initializeLicences()
        dbLicenceList = await getAllConceptsWithRole(LICENCE_CONCEPT_ROLE)
      }
      LICENCE_LIST = await dbConceptListToRudiRecursive(dbLicenceList)
    }
    return LICENCE_LIST
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

export const getLicenceCodes = async () => {
  const fun = `getLicenceCodes`
  try {
    logT(mod, fun)
    if (getLicenceCodeList().length === 0) {
      const licenceList = await getLicences()
      const licenceCodeList = licenceList.map((obj) => obj[API_SKOS_CONCEPT_CODE])
      setLicenceCodes(licenceCodeList.sort())
    }
    return getLicenceCodeList()
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

/**
 * Returns all possibles labels for all licences available
 * @returns an Object with keys: licenceCodes and elements: all possible labels for this code
 */
export const getLicenceLabels = async () => {
  const fun = 'getLicenceLabels'

  let result = {}
  try {
    const licenceList = await getLicences()
    for (const licence of licenceList) {
      let licenceId = accessProperty(licence, API_SKOS_CONCEPT_CODE)
      let licenceNames = getLicenceNames(licence)
      // logD(mod, fun, beautify(licenceNames))
      result[licenceId] = licenceNames
    }
    return result
  } catch (e) {
    throw RudiError.treatError(mod, fun, e)
  }
}

/**
 * Return all possibles names for one licence
 * @param {*} obj the licence at json format, coming from getLicences
 */
export const getLicenceNames = (obj) => {
  // const fun = 'getLicenceNames'
  const labelList = accessProperty(obj, 'pref_label')
  const result = labelList.map((element) => {
    return accessProperty(element, 'text')
  })
  return result
}

export const initializeLicences = async () => {
  const fun = 'initializeLicences'
  try {
    await cleanLicences()
    initLicenceCodes()
    logD(mod, fun, `Licences erased`)
    const licenceStr = JSON.stringify(licenceScheme)
    const licenceData = JSON.parse(licenceStr.replace(/\{\{\w+\}\}/g, () => uuid()))
    const reply = await newSkosScheme(licenceData)
    if (!reply) throw new InternalServerError(`Licence integration failed`)

    const newLicenceCodeList = await getLicenceCodes()
    setLicenceCodes(newLicenceCodeList.toSorted())
    logD(mod, fun, `Licences initialized`)
    return getLicenceCodeList()
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

export const getLicenceWithCode = async (licenceCode) => {
  return await searchDbIdWithJson(OBJ_LICENCES, { [API_LICENCE_LABEL]: licenceCode })
}

// -------------------------------------------------------------------------------------------------
// Controller
// -------------------------------------------------------------------------------------------------
export const getAllLicences = async (req, reply) => {
  const fun = `getAllLicences`
  logT(mod, fun, `< ${req?.method} ${req?.url}`)
  // logT(mod, fun)

  return await getLicences()
}

export const getAllLicenceCodes = async (req, reply) => {
  const fun = `getAllLicenceCodes`
  logT(mod, fun, `< ${req?.method} ${req?.url}`)
  // logT(mod, fun)

  return await getLicenceCodes()
}

export const initLicences = async (req, reply) => {
  const fun = `initLicences`
  logT(mod, fun, `< ${req?.method} ${req?.url}`)
  return await initializeLicences()
}
