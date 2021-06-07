/* eslint-disable prefer-const */
/* eslint-disable no-unused-vars */
'use strict'

const mod = 'licenceCtrl'

// -----------------------------------------------------------------------------
// External dependancies
// -----------------------------------------------------------------------------
const uuid = require('uuid')

// -----------------------------------------------------------------------------
// Internal dependancies
// -----------------------------------------------------------------------------
const sys = require('../config/confSystem')
const log = require('../utils/logging')
const utils = require('../utils/jsUtils')
const json = require('../utils/jsonAccess')

const db = require('../db/dbQueries')
const api = require('../config/confApi')
const { httpPost } = require('../utils/httpReq')

const { API_SKOS_CONCEPT_CODE } = require('../db/dbFields')

const skosController = require('./skosController')
// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------
exports.LicenceSchemeCode = 'software_licences'
exports.LicenceConceptRole = 'licence'

const LICENCE_POST_ADDRESS = `${sys.getHost()}${api.URL_PREFIX_PUBLIC}/${
  api.URL_OBJECT_SKOS_SCHEME
}`

// -----------------------------------------------------------------------------
// Controller
// -----------------------------------------------------------------------------
let LICENCE_LIST
let LICENCE_CODE_LIST

exports.getLicences = async () => {
  const fun = 'getLicenceList'
  if (!this.LICENCE_LIST) {
    log.d(mod, fun, `Init LICENCE_LIST`)
    let dblicenceList = await db.getAllConceptsWithRole(this.LicenceConceptRole)
    if (!utils.isNotEmptyArray(dblicenceList)) {
      await initLicences()
      dblicenceList = await db.getAllConceptsWithRole(this.LicenceConceptRole)
    }
    this.LICENCE_LIST = await skosController.dbConceptListToRudiRecursive(
      dblicenceList
    )
  }
  return this.LICENCE_LIST
}

exports.getLicenceCodes = async () => {
  // const fun = `getLicenceCodes`
  if (!this.LICENCE_CODE_LIST) {
    const licenceList = await this.getLicences()
    // log.d(mod, fun, `licence list: ${utils.beautify(licenceList)}`)

    this.LICENCE_CODE_LIST = await licenceList.map(
      (obj) => obj[API_SKOS_CONCEPT_CODE]
    )
  }
  // log.d(mod, fun, `licence codes: ${utils.beautify(this.LICENCE_CODE_LIST)}`)
  return this.LICENCE_CODE_LIST
}

async function initLicences() {
  const fun = 'initlicences'
  log.v(mod, fun, `${LICENCE_POST_ADDRESS}`)
  try {
    const licenceStr = JSON.stringify(require(`../api/licences.json`))
    const licenceData = JSON.parse(
      licenceStr.replace(/\{\{\w+\}\}/g, function (matched) {
        return uuid.v4()
      })
    )
    // log.d(mod, fun, licenceData)
    const res = await httpPost(LICENCE_POST_ADDRESS, licenceData)
    if (res.status === 200) {
      log.d(mod, fun, `Integration done`)
    } else {
      throw new Error(`Licence integration failed`)
    }
    // log.d(mod, fun, `Body: ${utils.beautify(res.data)}`)
  } catch (err) {
    log.e(mod, fun, err)
  }
}
// -----------------------------------------------------------------------------
// Controller
// -----------------------------------------------------------------------------
exports.getAllLicences = async (req, reply) => {
  const fun = `getAlllicences`
  log.v(mod, fun, `< GET ${api.URL_LICENCE_ACCESS}`)
  // log.d(mod, fun, ``)

  return await this.getLicences()
}

exports.getAllLicenceCodes = async (req, reply) => {
  const fun = `getAlllicenceCodes`
  log.v(mod, fun, `< GET ${api.URL_LICENCE_ACCESS}`)
  // log.d(mod, fun, ``)

  return await this.getLicenceCodes()
}

exports.init = async (req, reply) => {
  const fun = `init`
  log.v(mod, fun, ``)
  await initLicences()
}
