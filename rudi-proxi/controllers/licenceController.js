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

//---------------------------------------------------------------
// Constants
//---------------------------------------------------------------
let LICENCE_LIST

const LICENCE_POST_ADDRESS = `http://${sysConf.LISTENING_ADDR}:${sysConf.LISTENING_PORT}${api.URL_PREFIX_PUBLIC}/${api.URL_OBJECT_SKOS_SCHEME}`

//---------------------------------------------------------------
// Controller
//---------------------------------------------------------------
exports.getAllLicenses = async (req, reply) => {
  const fun = `getAllLicenses`
  log.v(mod, fun, `< GET ${api.URL_LICENCE_ACCESS}`)

  if (!this.LICENCE_LIST) {
    await initLicenses()
    const licenseList = await db.getAllConceptsWithRole(skos.LicenceConceptRole)
    this.LICENCE_LIST = await skosController.dbConceptListToRudiRecursive(licenseList)
  }
  return this.LICENCE_LIST
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
    log.d(`Status: ${json.beautify(res.status)}`);
    log.d('Body: ', json.beautify(res.data));
  } catch (err) {
    log.e(mod, fun, err)
  }
}