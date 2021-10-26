'use strict'

const mod = 'licenceCtrl'

// ------------------------------------------------------------------------------------------------
// External dependancies
// ------------------------------------------------------------------------------------------------
const uuid = require('uuid')

// ------------------------------------------------------------------------------------------------
// Internal dependancies
// ------------------------------------------------------------------------------------------------
const log = require('../utils/logging')
const { isEmptyArray, treatAndSendError } = require('../utils/jsUtils')
const db = require('../db/dbQueries')
const skosController = require('./skosController')

const { InternalServerError } = require('../utils/errors')

const {
  URL_PV_LICENCE_ACCESS,
  URL_PV_LICENCE_CODES_ACCESS,
  PARAM_ACTION_INIT,
} = require('../config/confApi')

const { API_SKOS_CONCEPT_CODE } = require('../db/dbFields')

// ------------------------------------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------------------------------------
exports.LicenceSchemeCode = 'software_licences'
exports.LicenceConceptRole = 'licence'

const LICENCES_FILE = `../api/licences.json`

// ------------------------------------------------------------------------------------------------
// Controller
// ------------------------------------------------------------------------------------------------
// Cache for licences
let LICENCE_LIST, LICENCE_CODE_LIST

exports.getLicences = async () => {
  const fun = 'getLicenceList'
  if (!LICENCE_LIST) {
    log.d(mod, fun, `Init LICENCE_LIST`)
    let dblicenceList = await db.getAllConceptsWithRole(this.LicenceConceptRole)
    if (isEmptyArray(dblicenceList)) {
      await this.initializeLicences()
      dblicenceList = await db.getAllConceptsWithRole(this.LicenceConceptRole)
    }
    LICENCE_LIST = await skosController.dbConceptListToRudiRecursive(dblicenceList)
  }
  return LICENCE_LIST
}

exports.getLicenceCodes = async () => {
  // const fun = `getLicenceCodes`
  if (!LICENCE_CODE_LIST) {
    const licenceList = await this.getLicences()
    LICENCE_CODE_LIST = licenceList.map((obj) => obj[API_SKOS_CONCEPT_CODE])
  }
  return LICENCE_CODE_LIST
}

exports.initializeLicences = async () => {
  const fun = 'initializeLicences'
  try {
    await db.cleanLicences()
    LICENCE_CODE_LIST = null
    log.d(mod, fun, `Licences initialized`)
    const licenceStr = JSON.stringify(require(LICENCES_FILE))
    const licenceData = JSON.parse(licenceStr.replace(/\{\{\w+\}\}/g, () => uuid.v4()))
    // log.d(mod, fun, licenceData)
    const reply = await skosController.newSkosScheme(licenceData)
    if (!reply) throw new InternalServerError(`Licence integration failed`)
    return await this.getLicenceCodes()
  } catch (err) {
    throw treatAndSendError(err, { mod: mod, fun: fun, err: err })
  }
}

// ------------------------------------------------------------------------------------------------
// Controller
// ------------------------------------------------------------------------------------------------
exports.getAllLicences = async (req, reply) => {
  const fun = `getAlllicences`
  log.v(mod, fun, `< GET ${URL_PV_LICENCE_ACCESS}`)
  // log.d(mod, fun, ``)

  return await this.getLicences()
}

exports.getAllLicenceCodes = async (req, reply) => {
  const fun = `getAlllicenceCodes`
  log.v(mod, fun, `< GET ${URL_PV_LICENCE_CODES_ACCESS}`)
  // log.d(mod, fun, ``)

  return await this.getLicenceCodes()
}

exports.initLicences = async (req, reply) => {
  const fun = `initLicences`
  log.v(mod, fun, `< POST ${URL_PV_LICENCE_ACCESS}/${PARAM_ACTION_INIT}`)
  return await this.initializeLicences()
}
