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
import { gzipSync } from 'zlib'
import {
  dbGetData,
  dbGetEveryData,
  dbGetRudiData,
  dbPostData,
  dbPutData,
  isCatalogType,
} from '../db/dbQueries.js'
import { beautify, capitalize, isObject, nowFileDate, pathJoin } from '../utils/jsUtils.js'
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

export const getDbData = async (req, reply) => {
  const fun = 'getDbData'
  try {
    const type = req.query?.type
    const logs = req.query?.logs
    logT(mod, fun, `type=${type}, logs=${logs}`)
    let getData
    if (!type) {
      getData = dbGetRudiData
    } else if (type == 'all') getData = dbGetEveryData
    else {
      const typeList = type.split(',').map((t) => {
        if (!isCatalogType(t))
          throw new BadRequestError(`Wrong input query: '${t}' is not a RUDI node Catalog object`)
        return t.trim()
      })
      getData = () => dbGetData(typeList)
    }
    const catalogData = await getData(logs)
    const catalogStr = JSON.stringify(catalogData, (key, value) =>
      typeof value === 'string' ? value.replace(/"([^"]+)"/g, '“$1”') : value
    )
    reply.header('Content-Encoding', 'gzip')
    reply.header('Content-Type', 'application/json')
    reply.header('Content-Disposition', `attachment; filename="RudiCatalog${capitalize(type)}.gz"`)
    return gzipSync(catalogStr)
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

export const restoreDbData = async (req, reply) => {
  const fun = 'restoreDbData'
  try {
    const data = req.body
    if (!isObject(data)) throw new BadRequestError('Input data should be a JSON')
    for (const key of Object.keys(data)) {
      if (!isCatalogType(key))
        throw new BadRequestError(`Wrong input data: key '${key}' is not a Catalog object`)
    }
    return await dbPostData(data)
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

export const updateDbData = async (req, reply) => {
  const fun = 'updateDbData'
  logT(mod, fun)
  const data = req.body
  // if (data.mimetype !== 'application/gzip') {
  //   return reply.code(415).send(new Error('Unsupported file type'))
  // }

  // const unzipped = unzipSync(data)
  // const data = req.body
  if (!isObject(data) && !Array.isArray(data))
    throw new BadRequestError('Input data should be a JSON')
  for (const key of Object.keys(data)) {
    if (!isCatalogType(key))
      throw new BadRequestError(`Wrong input data: key '${key}' is not a Catalog object`)
    logT(mod, fun, 'Found data for type: ' + key)
  }
  logT(mod, fun, 'Incoming data for types: ' + beautify(Object.keys(data)))

  return await dbPutData(data)
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
