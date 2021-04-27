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
const readLastLines = require('read-last-lines');

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
  PARAM_LOGS_LINES,
} = require('../config/confApi');



//---------------------------------------------------------------
// App ID
//---------------------------------------------------------------
exports.getAppId = () => {
  const fun = 'getAppId'
  try {
    // log.d(mod, fun, ` GET ${URL_APP_ID_ACCESS}`)
    const hashId = require('child_process').execSync('git rev-parse --short HEAD')
    // log.d(mod, fun, `${hashId}`.trim())

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

exports.getLogs = async (req, reply) => {
  const fun = 'getLogs'
  try {
    log.d(mod, fun, `GET ${URL_LOGS_ACCESS}`)

    /* beautify ignore:start */
    const readOptions = {encoding: 'utf8', flag: 'r'}
    /* beautify ignore:end */
    const logs = fs.readFileSync(sys.OUT_LOG, readOptions)   
    return logs
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}
exports.getLastLogLines = async (req, reply) => {
  const fun = 'getLogs'
  try {
    log.d(mod, fun, `GET ${URL_LOGS_ACCESS}/:${PARAM_LOGS_LINES}`)
    const nbLines = json.accessReqParam(req, PARAM_LOGS_LINES)    
    const logs = readLastLines.read(sys.OUT_LOG, nbLines)
    return logs
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}