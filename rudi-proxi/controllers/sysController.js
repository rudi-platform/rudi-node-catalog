'use strict'

const mod = 'sysCtrl'
/*
 * In this file are made the different steps followed for each
 * action on the contacts (producer or publisher)
 */

// -----------------------------------------------------------------------------
// External dependancies
// -----------------------------------------------------------------------------
const prcs = require('child_process')
const readLastLines = require('read-last-lines')

const mongoose = require('mongoose')
const boom = require('@hapi/boom')

// -----------------------------------------------------------------------------
// Internal dependancies
// -----------------------------------------------------------------------------
const sys = require('../config/confSystem')
const log = require('../utils/logging')
const utils = require('../utils/jsUtils')
const json = require('../utils/jsonAccess')

const {
  URL_PV_LOGS_ACCESS,
  URL_PV_GIT_HASH_ACCESS,
  URL_PV_NODE_VERSION_ACCESS,
  PARAM_LOGS_LINES,
} = require('../config/confApi')

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------
const NB_LOG_LINES_DEFAULT = 100
let CURRENT_APP_HASH

// -----------------------------------------------------------------------------
// App ID
// -----------------------------------------------------------------------------

/** Returns the actual git hash */
exports.getGitHash = () => {
  const fun = 'getGitHash'
  // log.d(mod, fun, ``)
  try {
    // log.d(mod, fun, ` GET ${URL_PV_GIT_HASH_ACCESS}`)
    const hashId = require('child_process').execSync('git rev-parse --short HEAD')
    // log.d(mod, fun, `${hashId}`.trim())

    return `${hashId}`.trim()
  } catch (err) {
    log.e(mod, fun, err)
    throw boom.boomify(err)
  }
}

/** Returns the git hash of the last time the app was launched */
exports.getAppHash = () => {
  const fun = 'getCurrentAppId'
  try {
    if (!CURRENT_APP_HASH) CURRENT_APP_HASH = this.getGitHash()
    return CURRENT_APP_HASH
  } catch (err) {
    log.e(mod, fun, err)
    throw boom.boomify(err)
  }
}

/** Returns the node and npm versions */
exports.getNodeVersion = async () => {
  const fun = 'getNodeVersion'
  try {
    // log.d(mod, fun, ` GET ${URL_PV_NODE_VERSION_ACCESS}`)
    const nodeVersion = prcs.execSync('node -v')
    const npmVersion = prcs.execSync('npm -v')
    const mongooseVersion = prcs.execSync('npm view mongoose version')
    const mongoDbVersion = await getMongDbVersion()
    const nVersions = {
      node: `${nodeVersion}`.trim(),
      npm: `${npmVersion}`.trim(),
      mongoose: `${mongooseVersion}`.trim(),
      mongodb: `${mongoDbVersion}`.trim(),
    }
    // log.d(mod, fun, `${utils.beautify(nVersions)}`)

    return nVersions
  } catch (err) {
    log.e(mod, fun, err)
    throw boom.boomify(err)
  }
}

async function getMongDbVersion() {
  const fun = 'getMongDbVersion'
  try {
    const admin = new mongoose.mongo.Admin(mongoose.connection.db)
    let mongoInfo = await admin.buildInfo()
    // log.d(mod, fun, `Mongo : ${mongoInfo.version}`)
    return mongoInfo.version
  } catch (err) {
    log.e(mod, fun, err)
  }
}
// -----------------------------------------------------------------------------
// Logs
// -----------------------------------------------------------------------------

exports.getLogs = async (req, reply) => {
  const fun = 'getLogs'
  try {
    log.d(mod, fun, `GET ${URL_PV_LOGS_ACCESS}`)
    /*
    const readOptions = {
      encoding: 'utf8',
      flag: 'r'
    }
    const logs = fs.readFileSync(sys.OUT_LOG, readOptions)
    */
    const nbLines = req.params[PARAM_LOGS_LINES] || req.params[QUERY_LIMIT] || NB_LOG_LINES_DEFAULT
    const logs = readLastLines.read(sys.OUT_LOG, nbLines)
    // const logs = readLastLines.read(sys.OUT_LOG, NB_LOG_LINES_DEFAULT)
    return logs
  } catch (err) {
    log.e(mod, fun, err)
    throw boom.boomify(err)
  }
}

exports.getLastLogLines = async (req, reply) => {
  const fun = 'getLastLogLines'
  try {
    log.d(mod, fun, `GET ${URL_PV_LOGS_ACCESS}/:${PARAM_LOGS_LINES}`)
    const nbLines = req.params[PARAM_LOGS_LINES] || req.params[QUERY_LIMIT] || NB_LOG_LINES_DEFAULT
    const logs = readLastLines.read(sys.OUT_LOG, nbLines)
    return logs
  } catch (err) {
    log.e(mod, fun, err)
    throw boom.boomify(err)
  }
}
