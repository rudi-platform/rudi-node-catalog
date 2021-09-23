/* eslint-disable no-unused-vars */
'use strict'

const mod = 'genCtrl'
/*
 * In this file are made the different steps followed for each
 * action on the objects (producer or publisher)
 */

// -----------------------------------------------------------------------------
// External dependancies
// -----------------------------------------------------------------------------
const mongoose = require('mongoose')
const { v4: UUIDv4 } = require('uuid')
// const url = require('url')
const { pick } = require('lodash')

// -----------------------------------------------------------------------------
// Internal dependancies
// -----------------------------------------------------------------------------
const log = require('../utils/logging')
const msg = require('../utils/msg')

const sys = require('../config/confSystem')
const db = require('../db/dbQueries')
const json = require('../utils/jsonAccess')

const { beautify, nowISO, isNotEmptyArray, isEmptyObject } = require('../utils/jsUtils')

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const {
  URL_PUB_METADATA,

  PARAM_OBJECT_METADATA,
  PARAM_OBJECT_ORGANIZATIONS,
  PARAM_OBJECT_CONTACTS,
  PARAM_OBJECT_MEDIA,
  PARAM_OBJECT_SKOS_CONCEPT,
  PARAM_OBJECT_SKOS_SCHEME,
  PARAM_ACTION_REPORT,
  PARAM_ACTION_DELETION,
  PARAM_ID,
  PARAM_OBJECT,

  QUERY_FIELDS,
  QUERY_LIMIT,
  QUERY_OFFSET,

  QUERY_FILTER,
  QUERY_SORT_BY,
  QUERY_COUNT_BY,
  QUERY_GROUP_BY,
  QUERY_GROUP_LIMIT,
  QUERY_GROUP_OFFSET,
  DEFAULT_QUERY_LIMIT,
  DEFAULT_QUERY_OFFSET,

  URL_OBJECTS,
  QUERY_CONFIRM,
  URL_PV_OBJECT_GENERIC,
  QUERY_UPDATED_AFTER,
  QUERY_UPDATED_BEFORE,
} = require('../config/confApi')

const {
  DB_PUBLISHED_AT,
  DB_ID,
  API_METAINFO_PROPERTY,
  API_METAINFO_DATES_PROPERTY,
  API_DATES_CREATED_PROPERTY,
  API_DATES_EDITED_PROPERTY,
  DB_UPDATED_AT,
  API_DATES_PUBLISHED_PROPERTY,
  DB_CREATE_AT,
} = require('../db/dbFields')

// -----------------------------------------------------------------------------
// Models
// -----------------------------------------------------------------------------

const Organization = require('../definitions/models/Organization')
const Contact = require('../definitions/models/Contact')
const SkosConcept = require('../definitions/models/SkosConcept')
const SkosScheme = require('../definitions/models/SkosScheme')

const { Report } = require('../definitions/models/Report')
const { Metadata } = require('../definitions/models/Metadata')
const { Media, MediaFile, MediaSeries } = require('../definitions/models/Media')

const { LogEntry } = require('../definitions/models/LogEntry')

// -----------------------------------------------------------------------------
// Specific controllers
// -----------------------------------------------------------------------------
const metadataController = require('../controllers/metadataController')
const organizationController = require('../controllers/organizationController')
const contactController = require('../controllers/contactController')
const skosController = require('./skosController')
const { deletePortalMetadata } = require('./portalController')
const {
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  MethodNotAllowedError,
  ObjectNotFoundError,
  BadRequestError,
  ParameterExpectedError,
} = require('../utils/errors')

// -----------------------------------------------------------------------------
// Specific object type helper functions
// -----------------------------------------------------------------------------
const QUERY_RESERVED_WORDS = [
  QUERY_LIMIT,
  QUERY_OFFSET,
  QUERY_FIELDS,
  QUERY_SORT_BY,
  QUERY_COUNT_BY,
  QUERY_GROUP_BY,
  QUERY_GROUP_LIMIT,
  QUERY_GROUP_OFFSET,
  QUERY_UPDATED_AFTER,
  QUERY_UPDATED_BEFORE,
  QUERY_CONFIRM,
]

const EXT_REFS = 'external_references' // External references needing aggregation
const EXT_OBJ = 'refObj'
const EXT_OBJ_PROP = 'refObjProp'
const EXT_OBJ_VAL = 'refObjVal'

exports.parseQueryParameters = async (objectType, reqUrl) => {
  const fun = 'parseQueryParameters'

  // identify object model
  const Model = db.getObjectModel(objectType)
  const modelProperties = db.getModelPropertyNames(Model)

  const returnedFilter = {
    [QUERY_LIMIT]: DEFAULT_QUERY_LIMIT,
    [QUERY_GROUP_LIMIT]: DEFAULT_QUERY_LIMIT,
    [QUERY_OFFSET]: DEFAULT_QUERY_OFFSET,
    [QUERY_GROUP_OFFSET]: DEFAULT_QUERY_OFFSET,
    [QUERY_FILTER]: {},
    [QUERY_CONFIRM]: false,
    [EXT_REFS]: [],
  }

  // extract request parameters
  if (reqUrl.indexOf('?') === -1) {
    // log.d(mod, fun, `No question mark in url: ${reqUrl}`)
    return returnedFilter
  }
  const reqSearch = reqUrl.substring(reqUrl.indexOf('?'))
  // log.d(mod, fun, `reqSearch: ${reqSearch}`)
  const urlSearchParams = new URLSearchParams(reqSearch)

  // Check if parameters were actually found by URLSearchParams
  if (urlSearchParams.keys().length < 1) {
    log.d(mod, fun, `No parameters found after the question mark: ${urlSearchParams}`)
    return returnedFilter
  }
  //  log.d(mod, fun, `urlSearchParams: ${urlSearchParams}`)

  for (const [key, value] of urlSearchParams) {
    if (QUERY_RESERVED_WORDS.includes(key)) {
      // log.d(mod, fun, `Key is a reserved word: ${beautify(key)} => ${beautify(queryParameters[key])}`)
      switch (key) {
        case QUERY_LIMIT:
        case QUERY_OFFSET:
        case QUERY_GROUP_LIMIT:
        case QUERY_GROUP_OFFSET:
          returnedFilter[key] = parseInt(value)
          break
        case QUERY_GROUP_BY:
        case QUERY_COUNT_BY:
          returnedFilter[key] = value
          break
        case QUERY_UPDATED_AFTER:
        case QUERY_UPDATED_BEFORE:
          const valueClean = value.replace(/[\'\"\`]/g, '')
          if (valueClean.match(new RegExp(/^[0-9]{10}$/))) {
            returnedFilter[key] = new Date(parseInt(valueClean * 1000))
          } else if (valueClean.match(new RegExp(/^[0-9]{13}$/))) {
            returnedFilter[key] = new Date(parseInt(valueClean))
          } else {
            returnedFilter[key] = new Date(valueClean)
          }
          break
        case QUERY_CONFIRM:
          if (['false', '0', 'null', 'no'].includes(value)) break
          returnedFilter[key] = !!value
          break
        case QUERY_FIELDS:
          returnedFilter[key] = value.split(',').map((field) => field.trim())
          break
        case QUERY_SORT_BY:
          returnedFilter[key] = value.split(',').map((field) => {
            let trimmedField = field.trim()
            let minus = ''
            let absoluteField = trimmedField
            if (trimmedField[0] === '-') {
              minus = '-'
              absoluteField = trimmedField.substring(1)
            }
            // Dealing with virtual fields
            const metaDates = `${API_METAINFO_PROPERTY}.${API_METAINFO_DATES_PROPERTY}.`
            switch (absoluteField) {
              case `${metaDates}${API_DATES_CREATED_PROPERTY}`:
                return `${minus}${DB_CREATE_AT}`
              case `${metaDates}${API_DATES_EDITED_PROPERTY}`:
                return `${minus}${DB_UPDATED_AT}`
              case `${metaDates}${API_DATES_PUBLISHED_PROPERTY}`:
                return `${minus}${DB_PUBLISHED_AT}`
              default:
                return trimmedField
            }
          })
          break
        default:
          log.w(mod, fun, `Query keyword not recognized: '${key}'`)
      }
    } else if (modelProperties.includes(key)) {
      // log.d(mod, fun, `Key is a ${objectType} property: ${beautify(key)}`)
      const val = value
      try {
        const obj = JSON.parse(val)
        // log.d(mod, fun, `parsed String: ${beautify(obj)}`)
        returnedFilter[QUERY_FILTER][key] = obj
      } catch (err) {
        const errMsg = `Error while parsing: '${beautify(val)}': ${err}}`
        // log.w(mod, fun, errMsg)
        returnedFilter[QUERY_FILTER][key] = val
      }
    } else {
      const indexSeparator = key.indexOf('.')
      const nestedField = key.substring(0, indexSeparator)
      const nestedFieldProp = key.substring(indexSeparator + 1)

      if (modelProperties.includes(nestedField)) {
        try {
          const obj = JSON.parse(value)
          log.d(
            mod,
            fun,
            `nestedField: ${nestedField} / nestedFieldProp: ${nestedFieldProp} / value: ${obj}`
          )

          returnedFilter[EXT_REFS].push({
            [EXT_OBJ]: nestedField,
            [EXT_OBJ_PROP]: nestedFieldProp,
            [EXT_OBJ_VAL]: obj,
          })
        } catch (err) {
          const errMsg = `Couldn't parse: '${beautify(value)}': ${err}}`
          // log.w(mod, fun, errMsg)
          returnedFilter[EXT_REFS].push({
            [EXT_OBJ]: nestedField,
            [EXT_OBJ_PROP]: nestedFieldProp,
            [EXT_OBJ_VAL]: value,
          })
        }
      } else {
        log.w(mod, fun, `Key is unkown and ignored for ${objectType}: ${beautify(key)}`)
        // log.w(mod, fun, `Model properties: ${beautify(modelProperties)}`)
      }
    }
  }
  // log.d(mod, fun, `filterReturn: ${beautify(filterReturn)}`)

  const extRefs = returnedFilter[EXT_REFS]
  if (isNotEmptyArray(extRefs)) {
    await Promise.all(
      extRefs.map(async (extRef) => {
        const extObj = extRef[EXT_OBJ]
        const extObjProp = extRef[EXT_OBJ_PROP]
        const extObjVal = extRef[EXT_OBJ_VAL]

        const objFilter = { [extObjProp]: extObjVal }

        log.d(mod, fun, `objFilter: ${beautify(objFilter)}`)
        let nestedFieldIds
        try {
          nestedFieldIds = await db.getNestedObject(objectType, extObj, objFilter, DB_ID)
        } catch (err) {
          log.w(mod, fun, err)
          // returnedFilter[QUERY_FILTER][extObj] = 0
          throw err
        }
        log.d(mod, fun, `nestedFieldIds: ${beautify(nestedFieldIds)}`)
        let queryFilter

        const ids = await Promise.all(
          nestedFieldIds.map(async (foundObj) => {
            log.d(mod, fun, `nestedFieldId: ${beautify(foundObj[DB_ID])}`)
            return new mongoose.Types.ObjectId(foundObj[DB_ID])
          })
        )

        returnedFilter[QUERY_FILTER][extObj] = { $in: ids }

        log.d(mod, fun, `filterReturn: ${beautify(returnedFilter)}`)
      })
    )
  }
  return returnedFilter
}

function checkIsUrlObject(objectType) {
  if (URL_OBJECTS.indexOf(objectType) === -1)
    throw new NotFoundError(msg.objectTypeNotFound(objectType))
}

async function newObject(objectType, objectData) {
  const fun = 'newObject'

  try {
    checkIsUrlObject(objectType)

    switch (objectType) {
      case PARAM_OBJECT_METADATA:
        return await metadataController.newMetadata(objectData)
      case PARAM_OBJECT_ORGANIZATIONS:
        return await organizationController.newOrganization(objectData)
      case PARAM_OBJECT_CONTACTS:
        return await contactController.newContact(objectData)
      case PARAM_OBJECT_SKOS_CONCEPT:
        return await skosController.newSkosConcept(objectData)
      case PARAM_OBJECT_SKOS_SCHEME:
        // Custom creation to create the children scheme concepts
        return await skosController.newSkosScheme(objectData)
      default:
        throw new NotFoundError(msg.objectTypeNotFound(objectType))
    }
  } catch (err) {
    log.w(mod, fun, err)
    throw err
  }
}

async function isObjectReferenced(objectType, rudiId) {
  const fun = 'isObjectReferenced'
  checkIsUrlObject(objectType)

  switch (objectType) {
    case PARAM_OBJECT_ORGANIZATIONS:
    case PARAM_OBJECT_CONTACTS:
    case PARAM_OBJECT_MEDIA: {
      log.d(mod, fun, `objectType: ${objectType}, id: ${rudiId}`)
      return await db.isReferencedInMetadata(objectType, rudiId)
    }
    default:
      return false
  }
}

exports.setPublishedFlag = async (dbObject, rudiId) => {
  const fun = 'setPublishedFlag'
  log.d(mod, fun, '')
  try {
    if (!dbObject) throw new ParameterExpectedError(fun, 'dbObject')
    if (!dbObject[DB_PUBLISHED_AT]) {
      dbObject[DB_PUBLISHED_AT] = nowISO()
      await dbObject.save()
      log.d(mod, fun, `dbObject published: ${beautify(dbObject)}`)
    } else {
      log.w(mod, fun, `Data was already published for id '${rudiId}'`)
    }
  } catch (err) {
    log.w(mod, fun, err)
    throw err
  }
}

// -----------------------------------------------------------------------------
// Controllers
// -----------------------------------------------------------------------------

/**
 * Add a new object
 * => POST /{object}/{id}
 */
exports.addSingleObject = async (req, reply) => {
  const fun = 'addSingleObject'
  log.v(mod, fun, `< POST ${URL_PV_OBJECT_GENERIC}`)
  try {
    // retrieve url parameters: object type, object id
    const objectType = json.accessReqParam(req, PARAM_OBJECT)

    // get the rudiId field for this object type
    const idField = db.getObjectIdField(objectType)
    // accessing the request body
    const rudiObject = req.body

    // retrieving the id
    // log.d(mod, fun, `objectType: '${objectType}', incomingData: '${beautify(rudiObject)}' `)
    const rudiId = json.accessProperty(rudiObject, idField)

    // First: we make sure object doesn't exist already
    const existsObject = await db.doesObjectExistWithJson(objectType, rudiObject)
    if (existsObject) throw new ForbiddenError(`${msg.objectAlreadyExists(objectType, rudiId)}`)

    // Creating new object + specific treatments
    const createdObject = await newObject(objectType, rudiObject)
    // log.v(mod, fun, beautify(createdObject, 2))
    log.i(mod, fun, `${msg.objectAdded(objectType, rudiId)}`)
    return createdObject
  } catch (err) {
    log.e(mod, fun, err)
    // reply.statusCode = 500
    // reply.message = err
    // reply.send()
    throw err
  }
}

/**
 * Get single object by ID
 * => GET /{object}/{id}
 */
exports.getSingleObject = async (req, reply) => {
  const fun = 'getSingleObject'
  log.v(mod, fun, `< GET ${URL_PV_OBJECT_GENERIC}/:${PARAM_ID}`)
  try {
    // retrieve url parameters: object type, object id
    const objectType = json.accessReqParam(req, PARAM_OBJECT)
    const objectId = json.accessReqParam(req, PARAM_ID)

    // ensure the object exists
    const dbObject = await db.getEnsuredObjectWithRudiId(objectType, objectId)
    // return the object
    return dbObject
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}

/**
 * Get several objects
 * => GET /{object}
 */
exports.getObjectList = async (req, reply) => {
  const fun = 'getObjectList'
  log.v(mod, fun, `< GET ${URL_PV_OBJECT_GENERIC}`)
  try {
    // retrieve url parameter: object type
    const objectType = json.accessReqParam(req, PARAM_OBJECT)
    return await this.getManyObjects(objectType, req, reply)
  } catch (err) {
    log.w(mod, fun, err)
    throw err
  }
}

/**
 * Get several objects for an particular object type
 */
exports.getManyObjects = async (objectType, req, reply) => {
  const fun = 'getManyObjects'
  try {
    let parsedParameters
    try {
      parsedParameters = await this.parseQueryParameters(objectType, req.url)
    } catch (err) {
      log.w(mod, fun, err)
      return []
    }

    const countBy = parsedParameters[QUERY_COUNT_BY]
    const groupBy = parsedParameters[QUERY_GROUP_BY]

    // accessing the objects
    let objectList
    if (!countBy && !groupBy) {
      const options = pick(parsedParameters, [
        QUERY_LIMIT,
        QUERY_OFFSET,
        QUERY_SORT_BY,
        QUERY_FILTER,
        QUERY_FIELDS,
        QUERY_UPDATED_AFTER,
        QUERY_UPDATED_BEFORE,
      ])
      objectList = await db.getObjectList(objectType, options)
    } else if (groupBy) {
      if (countBy) {
        const msg = `'${QUERY_GROUP_BY}' parameter found, '${QUERY_COUNT_BY}' is redondant and ignored`
        log.w(mod, fun, msg)
      }
      const options = pick(parsedParameters, [
        QUERY_LIMIT,
        QUERY_OFFSET,
        QUERY_FILTER,
        QUERY_FIELDS,
        QUERY_SORT_BY,
        QUERY_GROUP_LIMIT,
        QUERY_GROUP_OFFSET,
        QUERY_UPDATED_AFTER,
        QUERY_UPDATED_BEFORE,
      ])
      objectList = await db.groupObjectList(objectType, groupBy, options)
    } else {
      // if( !!countBy)
      const options = pick(parsedParameters, [
        QUERY_LIMIT,
        QUERY_OFFSET,
        QUERY_FILTER,
        QUERY_FIELDS,
        QUERY_UPDATED_AFTER,
        QUERY_UPDATED_BEFORE,
      ])

      objectList = await db.countObjectList(objectType, countBy, options)
    }
    // log.d(mod, fun, `objectList: ${beautify(objectList)}`)

    return objectList
  } catch (err) {
    log.w(mod, fun, err)
    throw err
  }
}

/**
 * Update an existing object (obsolete)
 * => PUT /{object}
 */
exports.updateSingleObject = async (req, reply) => {
  const fun = 'updateSingleObject'
  log.v(mod, fun, `< PUT ${URL_PV_OBJECT_GENERIC}`)
  try {
    // retrieve url parameters: object type, object id
    const objectType = json.accessReqParam(req, PARAM_OBJECT)
    const idField = db.getObjectIdField(objectType)

    const updateData = req.body

    // retrieve url parameters: object type, object id
    const rudiId = json.accessProperty(updateData, idField)

    const existsObject = await db.doesObjectExistWithRudiId(objectType, rudiId)
    if (!existsObject) throw new ObjectNotFoundError(objectType, rudiId)

    if (objectType === PARAM_OBJECT_METADATA) {
      return await metadataController.overwriteMetadata(updateData)
    } else {
      return await db.overwriteObject(objectType, updateData)
    }
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}

/**
 * Update an existing object or creates it if it doesn't exist
 * => PUT /{object}
 */
exports.upsertSingleObject = async (req, reply) => {
  const fun = 'upsertSingleObject'
  log.v(mod, fun, `< PUT ${URL_PV_OBJECT_GENERIC}`)
  try {
    // retrieve url parameters: object type, object id
    const objectType = json.accessReqParam(req, PARAM_OBJECT)
    const idField = db.getObjectIdField(objectType)

    const updateData = req.body

    // retrieve url parameters: object type, object id
    const rudiId = json.accessProperty(updateData, idField)

    const existsObject = await db.doesObjectExistWithRudiId(objectType, rudiId)

    if (!existsObject) {
      return await newObject(objectType, updateData)
    } else {
      if (objectType === PARAM_OBJECT_METADATA) {
        return await metadataController.overwriteMetadata(updateData)
      } else {
        return await db.overwriteObject(objectType, updateData)
      }
    }
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}

/**
 * Delete a single object
 * => DELETE /{object}/{id}
 */
exports.deleteSingleObject = async (req, reply) => {
  const fun = 'deleteSingleObject'
  log.v(mod, fun, `< DELETE ${URL_PV_OBJECT_GENERIC}/:${PARAM_ID}`)
  try {
    // retrieve url parameters: object type, object id
    const objectType = json.accessReqParam(req, PARAM_OBJECT)
    const objectRudiId = json.accessReqParam(req, PARAM_ID)

    // ensure the object exists
    const objectToDelete = await db.getEnsuredObjectWithRudiId(objectType, objectRudiId)

    if (await isObjectReferenced(objectType, objectRudiId))
      throw new ForbiddenError(msg.objectNotDeletedBecauseUsed(objectType, objectRudiId))

    // TODO: if SkosScheme: delete all SkosConcepts that reference it
    // TODO: if SkosConcept: update all other SkosConcepts that reference it (parents/children/siblings/relatives)
    const reply = await db.deleteObject(objectType, objectRudiId)

    if (objectType === PARAM_OBJECT_METADATA) {
      deletePortalMetadata(objectRudiId)
        .catch((err) =>
          log.e(mod, fun, `Portal couldn't delete metadata '${objectRudiId}': ${err}`)
        )
        .then((result) => log.i(mod, fun, `Portal successfully deleted metadata '${objectRudiId}'`))
    }

    return reply
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}

/**
 * Delete several objects
 * => POST /{object}/deletion
 */
exports.deleteObjectList = async (req, reply) => {
  const fun = 'deleteObjectList'
  log.v(mod, fun, `< POST ${URL_PV_OBJECT_GENERIC}/${PARAM_ACTION_DELETION}`)
  try {
    // retrieve url parameters: object type, object id
    const objectType = json.accessReqParam(req, PARAM_OBJECT)

    // identify object model
    const { Model, idField } = db.getObjectAccesses(objectType)

    // TODO: retrieve the metadata ids, DELETE on portal side with
    // deletePortalMetadata(id)

    // retrieve incoming data
    const filter = req.body
    log.d(mod, fun, beautify(filter))
    let deletionResult
    if (Array.isArray(filter)) {
      deletionResult = await db.deleteManyWithRudiIds(objectType, filter)
    } else {
      deletionResult = await db.deleteManyWithFilter(objectType, filter)
    }
    return deletionResult
  } catch (err) {
    log.e(mod, fun, err)
    log.e(mod, fun, `method: ${beautify(req.method)}`)
    log.e(mod, fun, `url: ${beautify(req.url)}`)
    log.e(mod, fun, `params: ${beautify(req.params)}`)
    log.e(mod, fun, `body: ${beautify(req.body)}`)
    throw err
  }
}

/**
 * Delete every object
 * => DELETE /{object}
 */
exports.deleteManyObjects = async (req, reply) => {
  const fun = 'deleteManyObjects'
  log.v(mod, fun, `< DELETE ${URL_PV_OBJECT_GENERIC}`)
  try {
    const objectType = json.accessReqParam(req, PARAM_OBJECT)

    let parsedParameters = await this.parseQueryParameters(objectType, req.url)
    log.d(mod, fun, `parsedParameters: ${beautify(parsedParameters)}`)
    const filter = parsedParameters[QUERY_FILTER]
    const fields = parsedParameters[QUERY_FIELDS]
    const confirmation = parsedParameters[QUERY_CONFIRM] || false

    if (isEmptyObject(filter)) {
      if (confirmation) return await db.deleteAll(objectType)
      else {
        const msg = `use confirm=true as a parameter to confirm the deletion of all ${objectType}`
        log.w(mod, fun, msg)
        return msg
      }
    }
    // TODO: retrieve the metadata ids, DELETE on portal side with
    // deletePortalMetadata(id)

    return await db.deleteManyWithFilter(objectType, filter)
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}

/**
 * Generate an UUID v4
 */
exports.getOrphans = async (objectType) => {
  const fun = 'getUnlinkdedObjects'
  log.d(mod, fun, `< GET ${URL_PV_OBJECT_GENERIC}/${PARAM_ACTION_UNLINKED}`)

  return await db.getOrphans(objectType)
}

/**
 * Generate an UUID v4
 */
exports.generateUUID = async (req, reply) => {
  const fun = 'generateUUID'
  log.d(mod, fun, ``)
  try {
    return UUIDv4()
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}
