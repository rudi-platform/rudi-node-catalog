const mod = 'dbAct'

// ------------------------------------------------------------------------------------------------
// External dependencies
// ------------------------------------------------------------------------------------------------
import mongoose from 'mongoose'
const { connection } = mongoose

// ------------------------------------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------------------------------------
import { DICT_LANG } from './dbFields.js'

// ------------------------------------------------------------------------------------------------
// Internal dependencies
// ------------------------------------------------------------------------------------------------
import { beautify } from '../utils/jsUtils.js'
import { LogEntry } from '../definitions/models/LogEntry.js'
import { logD, logT, logV, logW } from '../utils/logging.js'
import { RudiError } from '../utils/errors.js'

// ------------------------------------------------------------------------------------------------
// Actions on DB tables
// ------------------------------------------------------------------------------------------------
export const getCollections = async () => {
  const fun = `getCollections`
  try {
    const collections = await connection.db.listCollections().toArray()
    collections.map((collection) => collection.name)
    return collections
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

export const dropDB = async (req, reply) => {
  const fun = `dropDB`
  try {
    logT(mod, fun, ``)
    /* Drop the whole DB !!! */
    // const dbActionResult = await connection.db.dropDatabase()
    // logD(mod, fun, 'DB dropped')

    const logsCollection =
      LogEntry && LogEntry.collection && LogEntry.collection.name
        ? LogEntry.collection.name
        : 'logentries'

    const listCollections = await connection.db.listCollections().toArray()
    // logD(mod, fun, `listCollections: ${utils.beautify(listCollections)}`)
    logD(mod, fun, `listCollections: ${beautify(listCollections)}`)

    const collectionDropped = {}
    await Promise.all(
      listCollections.map(async (collection) => {
        if (!collection) logD(mod, fun, `Weird: ${beautify(collection)}`)
        if (collection.name !== logsCollection) {
          logD(mod, fun, `dropping '${collection.name}'`)
          connection.db.dropCollection(collection.name)
          collectionDropped[collection.name] = true
        }
      })
    )
    return collectionDropped
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

export const dropCollection = async (collectionName) => {
  const fun = `dropCollection`
  try {
    const listCollections = await connection.db.listCollections().toArray()
    // logD(mod, fun, `listCollections: ${utils.beautify(listCollections)}`)
    let isCollectionDropped = false
    await Promise.all(
      listCollections.map(async (collection) => {
        if (collection.name === collectionName) {
          connection.db.dropCollection(collectionName)
          isCollectionDropped = true
          return isCollectionDropped
        }
        return isCollectionDropped
      })
    )
    if (isCollectionDropped) {
      logD(mod, fun, `Dropped collection '${collectionName}'`)
      return true
    } else {
      logD(mod, fun, `Collection '${collectionName}' was not found`)
      return false
    }
  } catch (err) {
    // logW(mod, fun, err)
    throw RudiError.treatError(mod, fun, err)
  }
}

// const MDB_SEARCH_INDEXES = { _fts: 'text', _ftsx: 1 }
const SEARCH_INDEX = 'searchIndex'

export const makeSearchable = async (Model) => {
  const fun = 'makeSearchable'
  try {
    // logT(mod, fun, ``)
    let collection
    try {
      collection = Model.collection
    } catch (err) {
      logD(mod, fun, `No collection for '${Model.name}: ${err}`)
      return
    }
    if (!collection) {
      logD(mod, fun, `No collection for '${Model.name}`)
      return
    }
    let searchableFields
    try {
      searchableFields = Model.getSearchableFields()
      if (!searchableFields) throw Error()
    } catch (err) {
      // => searchableFields is undefined or method Model.getSearchableFields() doesn't exist
      logD(mod, fun, `No searchable fields for '${collection.name}`)
      return
    }

    logD(mod, fun, `Searchable fields for ${collection.name}: ${searchableFields}`)

    // Dropping current text indexes if they exist
    try {
      const indexes = collection.getIndexes()
      if (!!indexes[SEARCH_INDEX]) {
        const val = indexes[SEARCH_INDEX]
        logD(mod, fun, `Search already exists: ${collection.name} - ${val}`)
        // logT(mod, fun, `Dropping search indexes for '${collection.name}'`)
        // await collection.dropIndex(SEARCH_INDEX)
      }
    } catch (er) {
      if (er.codeName === 'NamespaceNotFound') logV(mod, fun, 'Not dropping inexistant indexes')
      else logW(mod, fun, er) // throw er?
    }
    // Preparing the 'text' (=== searchable) indexes
    const searchIndexes = {}
    searchableFields.map((field) => (searchIndexes[field] = 'text'))

    const indexOpts = {
      name: SEARCH_INDEX,
      default_language: 'french',
      language_override: DICT_LANG,
    }

    // (Re)creating the indexes
    // logT(mod, fun, `Creating search indexes for collection '${collection.name}'}`)
    await collection
      .createIndex(searchIndexes, indexOpts)
      .then(
        logT(
          mod,
          fun,
          `Created ${collection.name} indexes: ${
            (await collection.getIndexes())[SEARCH_INDEX] ? 'ok' : 'KO!!'
          }`
        )
      )
  } catch (err) {
    logW(mod, fun, `Couldn't create indexes for '${Model.collection.name}': ${err}`)
    throw RudiError.treatError(mod, fun, err)
  }
}
