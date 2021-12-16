'use strict'

const mod = 'dbAct'

// ------------------------------------------------------------------------------------------------
// External dependancies
// ------------------------------------------------------------------------------------------------
const mongoose = require('mongoose')

// ------------------------------------------------------------------------------------------------
// Internal dependencies
// ------------------------------------------------------------------------------------------------
const log = require('../utils/logging')
const { RudiError } = require('../utils/errors')

// ------------------------------------------------------------------------------------------------
// Actions on DB tables
// ------------------------------------------------------------------------------------------------
exports.getCollections = async () => {
  const fun = `getCollections`
  try {
    const collections = await mongoose.connection.db.listCollections().toArray()
    collections.map((collection) => collection.name)
    return collections
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

exports.dropDB = async (req, reply) => {
  const fun = `dropDB`
  try {
    /* Drop the whole DB !!! */
    const dbActionResult = await mongoose.connection.db.dropDatabase()
    log.d(mod, fun, 'DB dropped')
    return dbActionResult
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

exports.dropCollection = async (collectionName) => {
  const fun = `dropCollection`
  try {
    const listCollections = await mongoose.connection.db.listCollections().toArray()
    // log.d(mod, fun, `listCollections: ${utils.beautify(listCollections)}`)
    let isCollectionDropped = false
    await Promise.all(
      listCollections.map(async (collection) => {
        if (collection.name === collectionName) {
          mongoose.connection.db.dropCollection(collectionName)
          isCollectionDropped = true
          return isCollectionDropped
        }
        return isCollectionDropped
      })
    )
    if (isCollectionDropped) {
      log.d(mod, fun, `Dropped collection '${collectionName}'`)
      return true
    } else {
      log.d(mod, fun, `Collection '${collectionName}' was not found`)
      return false
    }
  } catch (err) {
    // log.w(mod, fun, err)
    throw RudiError.treatError(mod, fun, err)
  }
}

// const MDB_SEARCH_INDEXES = { _fts: 'text', _ftsx: 1 }
const SEARCH_INDEX = 'searchIndex'

exports.makeSearchable = async (Model, listFields) => {
  const fun = 'makeSearchable'
  try {
    log.t(mod, fun, ``)
    const collection = Model.collection

    // Preparing the 'text' (== searchable) indexes
    const searchIndexes = {}
    listFields.map((field) => (searchIndexes[field] = 'text'))

    const indexOpts = {
      default_language: 'fr',
      name: SEARCH_INDEX,
    }

    // log.d(mod, fun, utils.beautify(searchIndexes))

    // Dropping current text indexes if they exist
    const indexes = await collection.getIndexes()
    await Promise.all(
      Object.entries(indexes).map(async (key) => {
        // log.d(mod, fun, `${collection.name} - ${index}: ${key}`)
        if (key == `${SEARCH_INDEX},_fts,text,_ftsx,1`) {
          log.t(mod, fun, `Dropping search indexes for '${collection.name}'`)
          await collection.dropIndex(SEARCH_INDEX)
        }
      })
    )
    // (Re)creating the indexes
    log.t(mod, fun, `Creating search indexes for collection '${collection.name}'`)
    await collection.createIndex(searchIndexes, indexOpts)
  } catch (err) {
    log.w(mod, fun, `Couldn't create indexes for '${Model.collection.name}': ${err}`)
    throw RudiError.treatError(mod, fun, err)
  }
}
