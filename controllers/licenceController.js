/* eslint-disable prefer-const */
/* eslint-disable no-unused-vars */
'use strict'

const mod = 'licenceCtrl'

// ------------------------------------------------------------------------------------------------
// External dependancies
// ------------------------------------------------------------------------------------------------
const uuid = require('uuid')

// ------------------------------------------------------------------------------------------------
// Internal dependancies
// ------------------------------------------------------------------------------------------------
const sys = require('../config/confSystem')
const log = require('../utils/logging')
const utils = require('../utils/jsUtils')
const json = require('../utils/jsonAccess')
const { InternalServerError } = require('../utils/errors')

const db = require('../db/dbQueries')
const { httpPost, directPost } = require('../utils/httpReq')
const {
  URL_PREFIX_PRIVATE,
  PARAM_OBJECT_SKOS_SCHEME,
  URL_PV_LICENCE_ACCESS,
  URL_PV_LICENCE_CODES_ACCESS,
  PARAM_ACTION_INIT,
} = require('../config/confApi')

const { API_SKOS_CONCEPT_CODE } = require('../db/dbFields')

const skosController = require('./skosController')
// ------------------------------------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------------------------------------
exports.LicenceSchemeCode = 'software_licences'
exports.LicenceConceptRole = 'licence'

const LICENCES_FILE = `../api/licences.json`
const LICENCE_POST_ADDRESS = `${sys.getHost()}${URL_PREFIX_PRIVATE}/${PARAM_OBJECT_SKOS_SCHEME}`

// ------------------------------------------------------------------------------------------------
// Controller
// ------------------------------------------------------------------------------------------------
let LICENCE_LIST
let LICENCE_CODE_LIST

exports.getLicences = async () => {
  const fun = 'getLicenceList'
  if (!this.LICENCE_LIST) {
    log.d(mod, fun, `Init LICENCE_LIST`)
    let dblicenceList = await db.getAllConceptsWithRole(this.LicenceConceptRole)
    if (utils.isEmptyArray(dblicenceList)) {
      await this.initializeLicences()
      dblicenceList = await db.getAllConceptsWithRole(this.LicenceConceptRole)
    }
    this.LICENCE_LIST = await skosController.dbConceptListToRudiRecursive(dblicenceList)
  }
  return this.LICENCE_LIST
}

exports.getLicenceCodes = async () => {
  // const fun = `getLicenceCodes`
  if (!this.LICENCE_CODE_LIST) {
    const licenceList = await this.getLicences()
    // log.d(mod, fun, `licence list: ${utils.beautify(licenceList)}`)

    this.LICENCE_CODE_LIST = licenceList.map((obj) => obj[API_SKOS_CONCEPT_CODE])
  }
  // log.d(mod, fun, `licence codes: ${utils.beautify(this.LICENCE_CODE_LIST)}`)
  return this.LICENCE_CODE_LIST
}

exports.initializeLicences = async () => {
  const fun = 'initializeLicences'
  // log.v(mod, fun, `${LICENCE_POST_ADDRESS}`)
  try {
    await db.cleanLicences()
    LICENCE_CODE_LIST = null
    log.d(mod, fun, `Licences initialized`)
    const licenceStr = JSON.stringify(require(LICENCES_FILE))
    const licenceData = JSON.parse(
      licenceStr.replace(/\{\{\w+\}\}/g, function (matched) {
        return uuid.v4()
      })
    )
    // log.d(mod, fun, licenceData)
    const reply = await skosController.newSkosScheme(licenceData)
    if (!reply) throw new InternalServerError(`Licence integration failed`)
    return await this.getLicenceCodes()
    /* 
    const res = await directPost(LICENCE_POST_ADDRESS, licenceData)
    if (res.status === 200) {
      log.d(mod, fun, `Integration done`)
      return await this.getLicenceCodes()
    } else {
      throw new InternalServerError(`Licence integration failed`)
    } */
    // log.d(mod, fun, `Body: ${utils.beautify(res.data)}`)
  } catch (err) {
    log.w(mod, fun, err)
    throw err
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
