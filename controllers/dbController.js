'use strict'

const mod = 'dbCtrl'
/*
 * In this file are made the different steps followed for each
 * action on the contacts (producer or publisher)
 */

// -----------------------------------------------------------------------------
// External dependancies
// -----------------------------------------------------------------------------
const { map } = require('lodash')

// -----------------------------------------------------------------------------
// Internal dependancies
// -----------------------------------------------------------------------------
const log = require('../utils/logging')
const db = require('../db/dbQueries')

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------
const { URL_PV_DB_ACCESS } = require('../config/confApi')
const { DB_NAME } = require('../config/confSystem')
const { NotFoundError, BadRequestError } = require('../utils/errors')

// -----------------------------------------------------------------------------
// Controllers
// -----------------------------------------------------------------------------

exports.getCollections = async (req, reply) => {
  const fun = 'getCollections'
  log.d(mod, fun, `< GET ${URL_PV_DB_ACCESS}`)
  try {
    const dbActionResult = await db.getCollections(DB_NAME)
    return map(dbActionResult, 'name')
  } catch (err) {
    log.e(mod, fun, err)
    if (err.name === 'MongoError') throw new BadRequestError(err)
    throw new NotFoundError(err)
  }
}

exports.dropDB = async (req, reply) => {
  const fun = 'dropDB'
  log.d(mod, fun, `< DELETE ${URL_PV_DB_ACCESS}`)
  try {
    const dbActionResult = await db.dropDB(DB_NAME)
    return dbActionResult
  } catch (err) {
    log.e(mod, fun, err)
    if (err.name === 'MongoError') throw new BadRequestError(err)
    throw new NotFoundError(err)
  }
}
