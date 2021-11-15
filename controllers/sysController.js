'use strict'

const mod = 'sysCtrl'
/*
 * In this file are made the different steps followed for each
 * action on the contacts (producer or publisher)
 */

// ------------------------------------------------------------------------------------------------
// External dependancies
// ------------------------------------------------------------------------------------------------
const prcs = require('child_process')

const mongoose = require('mongoose')

// ------------------------------------------------------------------------------------------------
// Internal dependancies
// ------------------------------------------------------------------------------------------------
const log = require('../utils/logging')
const utils = require('../utils/jsUtils')
const { treatError } = require('../utils/errors')

// ------------------------------------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------------------------------------
let CURRENT_APP_HASH

// ------------------------------------------------------------------------------------------------
// App ID
// ------------------------------------------------------------------------------------------------

/**
 * @returns the actual git hash
 */
exports.getGitHash = () => {
  const fun = 'getGitHash'
  // log.t(mod, fun, ``)
  try {
    // log.d(mod, fun, ` GET ${URL_PV_GIT_HASH_ACCESS}`)
    let hashId
    hashId = process.env.RUDI_API_GIT_REV

    if (!hashId)
      try {
        hashId = require('child_process').execSync('git rev-parse --short HEAD')
        // log.d(mod, fun, utils.beautify(process.env))
      } catch (err) {
        new Error(mod, fun, `No git hash: ${err}`)
      }

    return `${hashId}`.trim()
  } catch (err) {
    // log.e(mod, fun, err)
    throw treatError(err, { mod: mod, fun: fun })
  }
}

/** @returns the git hash of the last time the app was launched */
exports.getAppHash = () => {
  const fun = 'getCurrentAppId'
  try {
    if (!CURRENT_APP_HASH) CURRENT_APP_HASH = this.getGitHash()
    return CURRENT_APP_HASH
  } catch (err) {
    // log.e(mod, fun, err)
    throw treatError(err, { mod: mod, fun: fun })
  }
}

exports.ENV_DEV = 'local'
exports.ENV_TEST = 'test'
exports.ENV_SHARED = 'shared'
exports.ENV_RELEASE = 'release'

/** @returns the current environment for this module */
exports.getEnvironment = () => {
  const fun = 'getEnvironment'
  try {
    log.t(mod, fun, process.env.RUDI_API_ENV)
    const env = process.env.RUDI_API_ENV ? process.env.RUDI_API_ENV : utils.NOT_FOUND
    return env
  } catch (err) {
    // log.e(mod, fun, err)
    throw treatError(err, { mod: mod, fun: fun })
  }
}

/** Returns the node and npm versions */
exports.getNodeVersion = async () => {
  const fun = 'getNodeVersion'
  try {
    // log.d(mod, fun, ` GET ${URL_PV_NODE_VERSION_ACCESS}`)
    const nodeVersion = prcs.execSync('node -v')
    const npmVersion = prcs.execSync('npm -v')

    let mongooseVersion = 'n/a'
    try {
      mongooseVersion = prcs.execSync('npm view mongoose version')
    } catch (err) {
      log.w(mod, fun, `Command 'npm view mongoose version' failed: ${err}`)
    }

    let mongoDbVersion = 'n/a'
    try {
      mongoDbVersion = await getMongDbVersion()
    } catch (err) {
      log.w(mod, fun, `Couldn't get MongoDB version: ${err}`)
    }

    const nVersions = {
      node: `${nodeVersion}`.trim(),
      npm: `${npmVersion}`.trim(),
      mongoose: `${mongooseVersion}`.trim(),
      mongodb: `${mongoDbVersion}`.trim(),
    }
    // log.d(mod, fun, `${utils.beautify(nVersions)}`)

    return nVersions
  } catch (err) {
    // log.e(mod, fun, err)
    throw treatError(err, { mod: mod, fun: fun })
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
    throw treatError(err, { mod: mod, fun: fun })
  }
}
