'use strict'

const mod = 'repCtrl'
/*
 * This file describes the different steps followed for each
 * action on the intergration reports submitted by the Portal
 * (for metadata as well as organizations and contacts integration)
 */

// -----------------------------------------------------------------------------
// External dependancies
// -----------------------------------------------------------------------------
const { boomify } = require('@hapi/boom')

// -----------------------------------------------------------------------------
// Internal dependancies
// -----------------------------------------------------------------------------
const log = require('../utils/logging')
const msg = require('../utils/msg')

const db = require('../db/dbQueries')
const utils = require('../utils/jsUtils')
const json = require('../utils/jsonAccess')

const {setPublishedFlag} = require('../controllers/genericController')

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------
const {
  API_REPORT_ID,
  API_REPORT_RESOURCE_ID,
  API_REPORT_STATUS,
  LOCAL_REPORT_ERROR,
  LOCAL_REPORT_ERROR_TYPE,
  LOCAL_REPORT_ERROR_MSG,
  API_REPORT_VERSION,
  API_REPORT_ERRORS,
} = require('../db/dbFields')

const {
  PARAM_OBJECT,
  PARAM_ID,
  PARAM_REPORT_ID,
  QUERY_LIMIT,
  QUERY_OFFSET,
  PARAM_ACTION_REPORT,
  URL_PUB_METADATA,
  PARAM_ACTION_DELETION,
  VERSION,
  PARAM_OBJECT_METADATA,
  URL_PV_OBJECT_GENERIC,
  DEFAULT_QUERY_LIMIT,
  QUERY_FILTER,
} = require('../config/confApi')

// -----------------------------------------------------------------------------
// Data models
// -----------------------------------------------------------------------------
const { Report, IntegrationStatus } = require('../definitions/models/Report')

// -----------------------------------------------------------------------------
// Comformity functions
// -----------------------------------------------------------------------------
function fromPortalToRudiFormat(reportBody) {
  if (reportBody[API_REPORT_VERSION] === 'v1') {
    reportBody[API_REPORT_VERSION] = VERSION
  }
  if (!reportBody[API_REPORT_ERRORS] && !!reportBody.errors) {
    reportBody[API_REPORT_ERRORS] = reportBody.errors
  }
  return reportBody
}

// -----------------------------------------------------------------------------
// Controllers: integration report for any object
// -----------------------------------------------------------------------------

// Add a new report for one object integration
exports.addSingleReportForObject = async (req, reply) => {
  const fun = 'addSingleReportForObject'
  log.d(mod, fun, `< POST ${URL_PUB_METADATA}/:${PARAM_ID}/${PARAM_ACTION_REPORT}`)
  try {
    // retrieve url parameters: object type, object id
    const objectType = json.accessReqParam(req, PARAM_OBJECT)
    const urlObjectId = json.accessReqParam(req, PARAM_ID)

    const reportBody = fromPortalToRudiFormat(req.body)

    // retrieve body parameters: object id, report id
    const reportId = json.accessProperty(reportBody, API_REPORT_ID)
    const bodyObjectId = json.accessProperty(reportBody, API_REPORT_RESOURCE_ID)

    // ensure url object id and body object id match
    if (urlObjectId !== bodyObjectId)
      throw new Error(`${msg.parametersMismatch(urlObjectId, bodyObjectId)}`)

    // ensure object exists
    const dbObject = await db.getObjectWithRudiId(objectType, urlObjectId)
    if (!dbObject) {
      reportBody[LOCAL_REPORT_ERROR] = {
        [LOCAL_REPORT_ERROR_TYPE]: 'Object not found',
        [LOCAL_REPORT_ERROR_MSG]: `The '${objectType}' object concerned by the report was not found`,
      }
    }

    // ensure report doesn't exist
    const existsReport = await db.doesObjectExistWithRudiId(PARAM_ACTION_REPORT, reportId)
    if (existsReport) throw new Error(`${msg.objectAlreadyExists(PARAM_ACTION_REPORT, reportId)}`)

    // add new integration report
    log.d(mod, fun, `add new integration report`)
    const dbReadyReport = await new Report(reportBody)
    log.d(mod, fun, `save new integration report`)
    await dbReadyReport.save()
    log.i(mod, fun, `Report saved: ${utils.beautify(dbReadyReport)}`)
    log.d(mod, fun, `dbObject: ${utils.beautify(dbObject)}`)

    if (reportBody[API_REPORT_STATUS] === IntegrationStatus.OK) {
      await setPublishedFlag(dbObject, urlObjectId)
    }

    return dbReadyReport
  } catch (err) {
    log.e(mod, fun, err)
    throw boomify(err)
  }
}

// Update an existing report for one object integration (public)
exports.addOrEditSingleReportForMetadata = async (req, reply) => {
  const fun = 'addOrEditSingleReportForMetadata'
  log.d(mod, fun, `< PUT ${URL_PUB_METADATA}/:${PARAM_ID}/${PARAM_ACTION_REPORT}`)
  return await this.addOrEditSingleReport(PARAM_OBJECT_METADATA, req, reply)
}

// Update an existing report for one object integration (private)
exports.addOrEditSingleReportForObject = async (req, reply) => {
  const fun = 'addOrEditSingleReportForObject'
  log.d(mod, fun, `< PUT ${URL_PV_OBJECT_GENERIC}/:${PARAM_ID}/${PARAM_ACTION_REPORT}`)
  const objectType = json.accessReqParam(req, PARAM_OBJECT)
  return await this.addOrEditSingleReport(objectType, req, reply)
}

exports.addOrEditSingleReport = async (objectType, req, reply) => {
  const fun = 'addOrEditSingleReport'
  // log.d(mod, fun, ``)
  try {
    // retrieve url parameters: object type, object id
    const urlObjectId = json.accessReqParam(req, PARAM_ID)

    const reportBody = fromPortalToRudiFormat(req.body)
    // log.v(mod, fun, `new report: ${utils.beautify(reportBody)}`)

    // retrieve body parameters: object id, report id
    const reportId = json.accessProperty(reportBody, API_REPORT_ID)
    const bodyObjectId = json.accessProperty(reportBody, API_REPORT_RESOURCE_ID)

    // ensure url object id and body object id match
    if (urlObjectId !== bodyObjectId)
      throw new Error(`${msg.parametersMismatch(urlObjectId, bodyObjectId)}`)

    // ensure object exists
    const dbObject = await db.getObjectWithRudiId(objectType, urlObjectId)
    if (!dbObject) {
      reportBody[LOCAL_REPORT_ERROR] = {
        [LOCAL_REPORT_ERROR_TYPE]: 'Object not found',
        [LOCAL_REPORT_ERROR_MSG]: `The '${objectType}' object concerned by the report was not found`,
      }
    }
    // if (!existsObject) throw new Error(`${msg.objectNotFound(objectType, urlObjectId)}`)

    // check if the report exists
    const dbReport = await db.getObjectWithRudiId(PARAM_ACTION_REPORT, reportId)

    let dbReadyReport
    if (!dbReport) {
      // adding new report
      log.d(mod, fun, `Adding new report`)
      // add new integration report
      dbReadyReport = await new Report(reportBody)
      await dbReadyReport.save()
      log.i(mod, fun, `Report created: ${utils.beautify(dbReadyReport)}`)
    } else {
      // updating existing report
      log.d(mod, fun, `Updating existing report`)
      dbReadyReport = await db.overwriteObject(PARAM_ACTION_REPORT, reportBody)
      log.i(mod, fun, `Report edited: ${utils.beautify(dbReadyReport)}`)
    }

    if (reportBody[API_REPORT_STATUS] === IntegrationStatus.OK) {
      await setPublishedFlag(dbObject, urlObjectId)
    }

    return dbReadyReport
  } catch (err) {
    log.w(mod, fun, err)
    throw err
  }
}

// Get every reports for one object integration (public)
exports.getReportListForMetadata = async (req, reply) => {
  const fun = 'getReportListForMetadata'
  log.d(mod, fun, `< GET ${URL_PUB_METADATA}/:${PARAM_ID}/${PARAM_ACTION_REPORT}`)
  return await this.getReportList(PARAM_OBJECT_METADATA, req, reply)
}

// Get every reports for one object integration (private)
exports.getReportListForObject = async (req, reply) => {
  const fun = 'getReportListForObject'
  log.d(mod, fun, `< GET ${URL_PV_OBJECT_GENERIC}/:${PARAM_ID}/${PARAM_ACTION_REPORT}`)
  const objectType = json.accessReqParam(req, PARAM_OBJECT)
  return await this.getReportList(objectType, req, reply)
}

exports.getReportList = async (objectType, req, reply) => {
  const fun = 'getReportList'
  log.d(mod, fun, ``)
  try {
    // retrieve url parameters: object id
    const urlObjectId = json.accessReqParam(req, PARAM_ID)

    // retrieve query parameters: 'limit' and 'offset'
    const limit = parseInt(req.query[QUERY_LIMIT]) || DEFAULT_QUERY_LIMIT
    const offset = parseInt(req.query[QUERY_OFFSET]) || 0

    // ensure object exists
    const existsObject = await db.doesObjectExistWithRudiId(objectType, urlObjectId)
    if (!existsObject) throw new Error(`${msg.objectNotFound(objectType, urlObjectId)}`)

    // get all reports for this object
    const options = {
      [QUERY_LIMIT]: limit,
      [QUERY_OFFSET]: offset,
      [QUERY_FILTER]: { [API_REPORT_RESOURCE_ID]: urlObjectId },
    }
    const dbReportList = await db.getObjectList(PARAM_ACTION_REPORT, options)

    return dbReportList
  } catch (err) {
    log.w(mod, fun, err)
    throw err
  }
}

// Get every reports for one object integration
exports.getSingleReportForMetadata = async (req, reply) => {
  const fun = 'getSingleReportForMetadata'
  log.d(
    mod,
    fun,
    `< GET ${URL_PUB_METADATA}/:${PARAM_ID}/${PARAM_ACTION_REPORT}/:${PARAM_REPORT_ID}`
  )
  return await this.getSingleReport(PARAM_OBJECT_METADATA, req, reply)
}

// Get every reports for one object integration
exports.getSingleReportForObject = async (req, reply) => {
  const fun = 'getSingleReportForObject'
  log.d(
    mod,
    fun,
    `< GET ${URL_PV_OBJECT_GENERIC}/:${PARAM_ID}/${PARAM_ACTION_REPORT}/:${PARAM_REPORT_ID}`
  )
  // retrieve url parameters: object type
  const objectType = json.accessReqParam(req, PARAM_OBJECT)
  return await this.getSingleReport(objectType, req, reply)
}

// Get every reports for one object integration
exports.getSingleReport = async (objectType, req, reply) => {
  const fun = 'getSingleReport'

  try {
    // retrieve url parameters: object id
    const urlObjectId = json.accessReqParam(req, PARAM_ID)
    const reportId = json.accessReqParam(req, PARAM_REPORT_ID)

    // ensure object exists
    const existsObject = await db.doesObjectExistWithRudiId(objectType, urlObjectId)
    if (!existsObject) throw new Error(`${msg.objectNotFound(objectType, urlObjectId)}`)

    // ensure report doesn't exist
    const dbReport = await db.getEnsuredObjectWithRudiId(PARAM_ACTION_REPORT, reportId)

    // ensure report is for the object
    const resourceId = json.accessProperty(dbReport, API_REPORT_RESOURCE_ID)
    if (resourceId !== urlObjectId)
      throw new Error(`${msg.objectNotFound(objectType, urlObjectId)}`)

    return dbReport
  } catch (err) {
    log.w(mod, fun, err)
    throw err
  }
}

// Get every reports for one object integration
exports.deleteSingleReportForObject = async (req, reply) => {
  const fun = 'deleteSingleReportForObject'
  log.d(
    mod,
    fun,
    `< DELETE ${URL_PUB_METADATA}/:${PARAM_ID}/${PARAM_ACTION_REPORT}/:${PARAM_REPORT_ID}`
  )
  try {
    // retrieve url parameters: object id
    // retrieve body parameters: report id

    // ensure object exists
    // ensure report exists

    // delete this integration report for this object
    return `Function '${fun}' still needs to be implemented in module ${mod}`
  } catch (err) {
    log.e(mod, fun, err)
    throw boomify(err)
  }
}

// Get every reports for one object integration
exports.deleteEveryReportForObject = async (req, reply) => {
  const fun = 'deleteEveryReportForObject'
  log.d(mod, fun, `< DELETE ${URL_PUB_METADATA}/:${PARAM_ID}/${PARAM_ACTION_REPORT}`)
  try {
    // retrieve url parameters: object id

    // ensure object exists

    // delete every integration report for this object
    return `Function '${fun}' still needs to be implemented in module ${mod}`
  } catch (err) {
    log.e(mod, fun, err)
    throw boomify(err)
  }
}

// Get every reports for one object integration
exports.deleteManyReportForObject = async (req, reply) => {
  const fun = 'deleteManyReportForObject'
  log.d(
    mod,
    fun,
    `< POST ${URL_PUB_METADATA}/:${PARAM_ID}/${PARAM_ACTION_REPORT}/${PARAM_ACTION_DELETION}`
  )
  try {
    // retrieve url parameters: object id

    // ensure object exists

    // delete every integration report for this object
    return `Function '${fun}' still needs to be implemented in module ${mod}`
  } catch (err) {
    log.e(mod, fun, err)
    throw boomify(err)
  }
}

// Get every reports for one object integration
exports.getReportListForObjectType = async (req, reply) => {
  const fun = 'getReportListForObjectType'
  log.d(mod, fun, `< GET ${URL_PUB_METADATA}/${PARAM_ACTION_REPORT}`)
  try {
    // delete every integration report for all objects
    return `Function '${fun}' still needs to be implemented in module ${mod}`
  } catch (err) {
    log.e(mod, fun, err)
    throw boomify(err)
  }
}
