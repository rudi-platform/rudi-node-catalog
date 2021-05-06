'use strict'

const mod = 'dbRwk'
/*
 * In this file are a set of functions that rework the data
 * - hide mongoose fields '_id' and '__v': they are not permanent
 *   so irrelevant
 * - replace attributes that link a mongoose document id by its
 *   attributes values, ie 'producer', 'contacts', and the ones
 *   that can be found in 'metadata_info'.
 */

// ---------------------------------------------------------------
// External dependancies
// ---------------------------------------------------------------

// ---------------------------------------------------------------
// Internal dependancies
// ---------------------------------------------------------------
const log = require('../utils/logging')
const msg = require('../utils/msg')

const json = require('../utils/jsonAccess')

// ---------------------------------------------------------------
// Constants
// ---------------------------------------------------------------
const {
  DB_ID,
  DB_V
} = require('./dbFields')

// ---------------------------------------------------------------
// Data models
// ---------------------------------------------------------------

// ---------------------------------------------------------------
// Unmongoozify functions
// ---------------------------------------------------------------

exports.unmongoosify = (dbObject) => {
  const fun = 'unmongoosify'
  log.d(mod, fun, '')
  try {
    if (!dbObject) throw new Error(`${msg.parameterExpected(fun, 'dbObject')}`)
    const cleanObject = json.deepClone(dbObject)
    delete cleanObject[DB_ID]
    delete cleanObject[DB_V]
    // log.d(mod, fun, `${dbObject}\n=>\n${json.beautify(cleanObject, 2)}`)
    return cleanObject
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}
