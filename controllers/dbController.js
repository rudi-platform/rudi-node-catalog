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

const { NotFoundError, BadRequestError, RudiError } = require('../utils/errors')
const { getDbName } = require('../config/confSystem')
const { dropDB, getCollections } = require('../db/dbActions')

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
    const dbActionResult = await getCollections(getDbName())
    return map(dbActionResult, 'name')
  } catch (err) {
    const error = err.name === 'MongoError' ? new BadRequestError(err) : new NotFoundError(err)
    throw RudiError.treatError(mod, fun, error)
  }
}

exports.dropDB = async (req, reply) => {
  const fun = 'dropDB'
  log.t(mod, fun, `< DELETE ${URL_PV_DB_ACCESS}`)
  try {
    const dbActionResult = await dropDB(getDbName())
    return dbActionResult
  } catch (err) {
    const error = err.name === 'MongoError' ? new BadRequestError(err) : new NotFoundError(err)
    throw RudiError.treatError(mod, fun, error)
  }
}
