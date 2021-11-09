'use strict'

const mod = 'dbCtrl'
/*
 * In this file are made the different steps followed for each
 * action on the contacts (producer or publisher)
 */

// ------------------------------------------------------------------------------------------------
// External dependancies
// ------------------------------------------------------------------------------------------------
const { map } = require('lodash')

// ------------------------------------------------------------------------------------------------
// Internal dependancies
// ------------------------------------------------------------------------------------------------
const log = require('../utils/logging')

const { URL_PV_DB_ACCESS } = require('../config/confApi')

const db = require('../db/dbQueries')
const { NotFoundError, BadRequestError, treatError } = require('../utils/errors')
const { getDbName } = require('../config/confSystem')

// ------------------------------------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------------------------------------

// ------------------------------------------------------------------------------------------------
// Controllers
// ------------------------------------------------------------------------------------------------

exports.getCollections = async (req, reply) => {
  const fun = 'getCollections'
  log.t(mod, fun, `< GET ${URL_PV_DB_ACCESS}`)
  try {
    const dbActionResult = await db.getCollections(getDbName())
    return map(dbActionResult, 'name')
  } catch (err) {
    const error = err.name === 'MongoError' ? new BadRequestError(err) : new NotFoundError(err)
    throw treatError(error, { mod: mod, fun: fun })
  }
}

exports.dropDB = async (req, reply) => {
  const fun = 'dropDB'
  log.t(mod, fun, `< DELETE ${URL_PV_DB_ACCESS}`)
  try {
    const dbActionResult = await db.dropDB(getDbName())
    return dbActionResult
  } catch (err) {
    const error = err.name === 'MongoError' ? new BadRequestError(err) : new NotFoundError(err)
    throw treatError(error, { mod: mod, fun: fun })
  }
}
