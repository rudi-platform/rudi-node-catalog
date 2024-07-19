const mod = 'dbCtrl'
/*
 * In this file are made the different steps followed for each
 * action on the contacts (producer or publisher)
 */

// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import { existsSync } from 'fs'
import _ from 'lodash'
const { map } = _

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------

import { MONGO_ERROR, PARAM_OBJECT, URL_PV_DB_ACCESS } from '../config/constApi.js'

import { BadRequestError, NotFoundError, RudiError } from '../utils/errors.js'

import { daDropCollection, daDropDB, daGetCollections } from '../db/dbActions.js'

import { execSync } from 'child_process'
import mongoose from 'mongoose'
import { nowFileDate, pathJoin } from '../utils/jsUtils.js'
import { accessReqParam } from '../utils/jsonAccess.js'
import { logT } from '../utils/logging.js'

// -------------------------------------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------------------------------------

// -------------------------------------------------------------------------------------------------
// Controllers
// -------------------------------------------------------------------------------------------------

export const getCollections = async (req, reply) => {
  const fun = 'getCollections'
  logT(mod, fun, `< GET ${URL_PV_DB_ACCESS}`)
  try {
    return map(await daGetCollections(), 'name').sort()
  } catch (err) {
    const error = err.name === MONGO_ERROR ? new BadRequestError(err) : new NotFoundError(err)
    throw RudiError.treatError(mod, fun, error)
  }
}

export const dropCollection = async (req, reply) => {
  const fun = 'dropCollection'
  logT(mod, fun, `< DELETE ${URL_PV_DB_ACCESS}/:${PARAM_OBJECT}`)
  try {
    const collectionName = accessReqParam(req, PARAM_OBJECT)
    const dbActionResult = await daDropCollection(collectionName)
    return dbActionResult
  } catch (err) {
    const error = err.name === MONGO_ERROR ? new BadRequestError(err) : new NotFoundError(err)
    throw RudiError.treatError(mod, fun, error)
  }
}

export const dropDB = async (req, reply) => {
  const fun = 'dropDB'
  logT(mod, fun, `< DELETE ${URL_PV_DB_ACCESS}`)
  try {
    const dbActionResult = await daDropDB()
    return dbActionResult
  } catch (err) {
    const error = err.name === MONGO_ERROR ? new BadRequestError(err) : new NotFoundError(err)
    throw RudiError.treatError(mod, fun, error)
  }
}

export const dumpDB = async (req, reply) => {
  const fun = 'dumpDB'
  logT(mod, fun, `< POST ${URL_PV_DB_ACCESS}/dump`)
  try {
    // const dumpDir = getDbDumpDir()
    const dumpDir = req.body
    if (!existsSync(dumpDir)) {
      throw new NotFoundError(`The DB dump folder does not exist: '${dumpDir}'`)
    }
    const dbName = mongoose.connection.name
    const dumpFile = pathJoin(dumpDir, `${nowFileDate()}rudi_catalog_dump.gz`)
    execSync(`mongodump -d ${dbName} --excludeCollection logentries --archive=${dumpFile} --gzip`)
    return { status: 'OK', act: 'archive', to: dumpFile }
    // const dbActionResult = await daDropDB()
    // return dbActionResult
  } catch (err) {
    const error = err.name === MONGO_ERROR ? new BadRequestError(err) : new NotFoundError(err)
    throw RudiError.treatError(mod, fun, error)
  }
}

export const restoreDB = async (req, reply) => {
  const fun = 'restoreDB'
  logT(mod, fun, `< POST ${URL_PV_DB_ACCESS}/restore`)
  try {
    const filePath = req.body
    if (!existsSync(filePath)) throw new NotFoundError(`No file was found for path '${filePath}'`)
    execSync(`mongorestore --archive="${filePath}" --gzip --numInsertionWorkersPerCollection=6`)
    return { status: 'OK', act: 'restore', from: filePath }
  } catch (err) {
    const error = err.name === MONGO_ERROR ? new BadRequestError(err) : new NotFoundError(err)
    throw RudiError.treatError(mod, fun, error)
  }
}
