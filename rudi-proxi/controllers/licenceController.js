/* eslint-disable prefer-const */
/* eslint-disable no-unused-vars */
'use strict'

const mod = 'licenceCtrl'

// ---------------------------------------------------------------
// External dependancies
// ---------------------------------------------------------------
const axios = require('axios')
const uuid = require('uuid')

// ---------------------------------------------------------------
// Internal dependancies
// ---------------------------------------------------------------
const sys = require('../config/confSystem')
const log = require('../utils/logging')
const utils = require('../utils/jsUtils')
const json = require('../utils/jsonAccess')

const db = require('../db/dbQueries')
const api = require('../config/confApi')

const {
  API_SKOS_CONCEPT_CODE
} = require('../db/dbFields')

const skosController = require('./skosController')
// ---------------------------------------------------------------
// Constants
// ---------------------------------------------------------------
exports.LicenceSchemeCode = 'software_licences'
exports.LicenceConceptRole = 'licence'

const LICENCE_POST_ADDRESS = `${sys.getHost()}${api.URL_PREFIX_PUBLIC}/${api.URL_OBJECT_SKOS_SCHEME}`

// ---------------------------------------------------------------
// Controller
// ---------------------------------------------------------------
let LICENCE_LIST
let LICENCE_CODE_LIST

exports.getLicences = async () => {
  const fun = 'getLicenceList'
  if (!LICENCE_LIST) {
    log.d(mod, fun, `Init LICENCE_LIST`)
    let dbLicenseList = await db.getAllConceptsWithRole(this.LicenceConceptRole)
    if (!utils.isNotEmptyArray(dbLicenseList)) {
      await initLicenses()
      dbLicenseList = await db.getAllConceptsWithRole(this.LicenceConceptRole)
    }
    LICENCE_LIST = await skosController.dbConceptListToRudiRecursive(dbLicenseList)
  }
  return LICENCE_LIST
}

exports.getLicenceCodes = async () => {
  // const fun = `getAllLicenceCodes`
  if (!LICENCE_CODE_LIST) {
    const licenceList = await this.getLicences()
    // log.d(mod, fun, `licence list: ${json.beautify(licenceList)}`)

    LICENCE_CODE_LIST = await licenceList.map(obj => obj[API_SKOS_CONCEPT_CODE])
  }
  // log.d(mod, fun, `licence codes: ${json.beautify(this.LICENCE_CODE_LIST)}`)
  return LICENCE_CODE_LIST
}

async function initLicenses() {
  const fun = 'initLicenses'
  log.v(mod, fun, `${LICENCE_POST_ADDRESS}`)
  try {
    const licenseStr = JSON.stringify(require(`../api/licenses.json`))
    const licenceData = licenseStr.replace(/\{\{\w+\}\}/g, function (matched) {
      return uuid.v4()
    })
    // log.d(mod, fun, licenceData)
    const res = await axios.post(LICENCE_POST_ADDRESS, JSON.parse(licenceData))
    log.d(mod, fun, `Status: ${json.beautify(res.status)}`)
    log.d(mod, fun, `Body: ${json.beautify(res.data)}`)
  } catch (err) {
    log.e(mod, fun, err)
  }
}
// ---------------------------------------------------------------
// Controller
// ---------------------------------------------------------------
exports.getAllLicenses = async (req, reply) => {
  const fun = `getAllLicenses`
  log.v(mod, fun, `< GET ${api.URL_LICENCE_ACCESS}`)
  // log.d(mod, fun, ``)

  return await this.getLicences()
}

exports.getAllLicenseCodes = async (req, reply) => {
  const fun = `getAllLicenseCodes`
  log.v(mod, fun, `< GET ${api.URL_LICENCE_ACCESS}`)
  // log.d(mod, fun, ``)

  return await this.getLicenceCodes()
}
