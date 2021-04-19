'use strict';

const mod = 'licenceCtrl'

//---------------------------------------------------------------
// External dependancies 
//---------------------------------------------------------------
const axios = require('axios')
const uuid = require('uuid');
const json = require('../utils/jsonAccess');
const {
  replace
} = require('lodash');


//---------------------------------------------------------------
// Internal dependancies 
//---------------------------------------------------------------
const sysConf = require('../config/confSystem');
const log = require("../utils/logging")

const db = require("../db/dbQueries");
const api = require("../config/confApi");

const skos = require("../config/confSKOS");
const skosController = require("./skosController");
const {
  API_SKOS_CONCEPT_CODE
} = require('../db/dbFields');
const utils = require('../utils/jsUtils');

//---------------------------------------------------------------
// Constants
//---------------------------------------------------------------

const LICENCE_POST_ADDRESS = `http://${sysConf.LISTENING_ADDR}:${sysConf.LISTENING_PORT}${api.URL_PREFIX_PUBLIC}/${api.URL_OBJECT_SKOS_SCHEME}`

//---------------------------------------------------------------
// Controller
//---------------------------------------------------------------
let LICENCE_LIST
let LICENCE_CODE_LIST

exports.getLicenceList = async () => {
  const fun = "getLicenceList"
  if (!this.LICENCE_LIST) {
    log.d(mod, fun, `Init LICENCE_LIST`)
    let dbLicenseList = await db.getAllConceptsWithRole(skos.LicenceConceptRole)
    if (!utils.isNotEmptyArray(dbLicenseList)) {
      await initLicenses()
      dbLicenseList = await db.getAllConceptsWithRole(skos.LicenceConceptRole)
    }
    this.LICENCE_LIST = await skosController.dbConceptListToRudiRecursive(dbLicenseList)
  }
  return this.LICENCE_LIST
}
 
exports.getAllLicenceCodes = async () => {
  const fun = `getAllLicenceCodes`
  if (!this.LICENCE_CODE_LIST) {
    const licenceList = await this.getLicenceList()
    log.d(mod, fun, `licence list: ${json.beautify(licenceList)}`)

    this.LICENCE_CODE_LIST = await licenceList.map(obj => obj[API_SKOS_CONCEPT_CODE])
  }
  log.d(mod, fun, `licence codes: ${json.beautify(this.LICENCE_CODE_LIST)}`)
  return this.LICENCE_CODE_LIST
}

async function initLicenses() {
  const fun = "initLicenses"
  log.v(mod, fun, `${LICENCE_POST_ADDRESS}`)
  try {
    const licenseStr = JSON.stringify(require(`../api/licenses.json`))
    const licenceData = licenseStr.replace(/\{\{\w+\}\}/g, function (matched) {
      return uuid.v4()
    })
    // log.d(mod, fun, licenceData)
    const res = await axios.post(LICENCE_POST_ADDRESS, JSON.parse(licenceData))
    log.d(mod, fun, `Status: ${json.beautify(res.status)}`);
    log.d(mod, fun, `Body: ${json.beautify(res.data)}`);
  } catch (err) {
    log.e(mod, fun, err)
  }
}
//---------------------------------------------------------------
// Controller
//---------------------------------------------------------------
exports.getAllLicenses = async (req, reply) => {
  const fun = `getAllLicenses`
  log.v(mod, fun, `< GET ${api.URL_LICENCE_ACCESS}`)
  // log.d(mod, fun, ``)

  return await this.getLicenceList()
}