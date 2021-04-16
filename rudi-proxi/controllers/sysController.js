'use strict';

const mod = 'sysCtrl'
/*
 * In this file are made the different steps followed for each 
 * action on the contacts (producer or publisher)
 */

//---------------------------------------------------------------
// External dependancies 
//---------------------------------------------------------------
const boom = require('@hapi/boom')
const fs = require('fs');
const prcs = require('child_process')

//---------------------------------------------------------------
// Internal dependancies 
//---------------------------------------------------------------
const sys = require('../config/confSystem');
const log = require('../utils/logging')
const msg = require('../utils/msg')
const json = require('../utils/jsonAccess');

const {
  URL_LOGS_ACCESS,
  URL_APP_ID_ACCESS,
  URL_NODE_VERSION_ACCESS,
  URL_THESAURUS_ACCESS,
  PARAM_THESAURUS_CODE,
} = require('../config/confApi');


//---------------------------------------------------------------
// Thesauri
//---------------------------------------------------------------
const Encodings = require('../definitions/thesaurus/Encodings');
const FileTypes = require('../definitions/thesaurus/FileTypes');
const HashAlgorithms = require('../definitions/thesaurus/HashAlgorithms');
const Keywords = require('../definitions/thesaurus/Keywords');
const Languages = require('../definitions/thesaurus/Languages');
const Projections = require('../definitions/thesaurus/Projections');
const Themes = require('../definitions/thesaurus/Themes');

//---------------------------------------------------------------
// App ID
//---------------------------------------------------------------
exports.getAppId = () => {
  const fun = 'getAppId'
  try {
    log.d(mod, fun, ` GET ${URL_APP_ID_ACCESS}`)
    const hashId = require('child_process').execSync('git rev-parse --short HEAD')
    log.d(mod, fun, `${hashId}`.trim())

    return `${hashId}`.trim()
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}

exports.getNodeVersion = () => {
  const fun = 'getNodeVersion'
  try {
    log.d(mod, fun, ` GET ${URL_NODE_VERSION_ACCESS}`)
    const nodeVersion = prcs.execSync('node -v')
    const npmVersion = prcs.execSync('npm -v')
    const nVersions = {
      'node version': `${nodeVersion}`.trim(),
      'npm version': `${npmVersion}`.trim()
    }
    log.d(mod, fun, `${json.beautify(nVersions)}`)

    return nVersions
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}

//---------------------------------------------------------------
// Logs
//---------------------------------------------------------------

exports.getLogs = () => {
  const fun = 'getLogs'
  try {
    log.d(mod, fun, `GET ${URL_LOGS_ACCESS}`)

    /* beautify ignore:start */
    const logs = fs.readFileSync(sys.OUT_LOG, {encoding: 'utf8', flag: 'r'});
    /* beautify ignore:end */
    return logs
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}

//---------------------------------------------------------------
// Thesaurus
//---------------------------------------------------------------
const THESAURI = {
  "Encodings": Encodings,
  "FileTypes": FileTypes,
  "HashAlgorithms": HashAlgorithms,
  "Keywords": Keywords,
  "Languages": Languages,
  "Projections": Projections,
  "Themes": Themes
}

exports.getEveryThesaurus = (req, reply) => {
  const fun = 'getEveryThesaurus'
  log.v(mod, fun, `< GET ${URL_THESAURUS_ACCESS}`)
  log.d(mod, fun, ``)
  return THESAURI
}

exports.getSingleThesaurus = (req, reply) => {
  const fun = 'getSingleThesaurus'
  log.v(mod, fun, `< GET ${URL_THESAURUS_ACCESS}/:${PARAM_THESAURUS_CODE}`)

  const thesaurusCode = json.accessReqParam(req, PARAM_THESAURUS_CODE)
  log.d(mod, fun, `thesaurusCode: ${thesaurusCode}`)

  const thesaurus = THESAURI[thesaurusCode]
  if (!thesaurus) throw new Error(`Thesaurus not found for such required code: ${json.beautify(thesaurusCode)}`)
  return thesaurus
}