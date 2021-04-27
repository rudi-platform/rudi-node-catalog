'use strict';

const mod = 'repCtrl'
/*
 * This file describes the different steps followed for each 
 * action on the intergration reports submitted by the Portal
 * (for metadata as well as organizations and contacts integration)
 */

//---------------------------------------------------------------
// External dependancies 
//---------------------------------------------------------------
const boom = require('@hapi/boom')

//---------------------------------------------------------------
// Internal dependancies 
//---------------------------------------------------------------
const log = require('../utils/logging')
const msg = require('../utils/msg')

const db = require('../db/dbQueries')
const dbRwk = require('../db/dbReworkData')
const json = require('../utils/jsonAccess')
const lang = require('../utils/lang')

const genericController = require('../controllers/genericController')

//---------------------------------------------------------------
// Constants
//---------------------------------------------------------------
const {
  DB_ID,
  API_METADATA_ID,
  API_ORGANIZATION_ID,
  API_CONTACT_ID,
  API_DATA_PRODUCER_PROPERTY,
  API_DATA_CONTACTS_PROPERTY,
  API_REPORT_ID,
  API_REPORT_RESOURCE_ID,
  API_REPORT_STATUS
} = require('../db/dbFields')

const {
  PARAM_OBJECT,
  PARAM_ID,
  PARAM_REPORT_ID,
  QUERY_LIMIT,
  QUERY_OFFSET,
  URL_ACTION_REPORT,
  URL_OBJECT,
  URL_ACTION_DELETION
} = require('../config/confApi')

//---------------------------------------------------------------
// Data models
//---------------------------------------------------------------
const Metadata = require('../definitions/models/Metadata');
const {
  Report,
  IntegrationStatus
} = require('../definitions/models/Report');

//---------------------------------------------------------------
// Controllers: integration report for any object 
//---------------------------------------------------------------

// Add a new report for one object integration
exports.addSingleReportForObject = async (req, reply) => {
  const fun = 'addSingleReportForObject'
  log.d(mod, fun, `< POST ${URL_OBJECT}/:${PARAM_ID}/${URL_ACTION_REPORT}`)
  try {
    // retrieve url parameters: object type, object id
    const objectType = json.accessReqParam(req, PARAM_OBJECT)
    const urlObjectId = json.accessReqParam(req, PARAM_ID)

    /* beautify ignore:start */
    // identify object model
    const {Model, idField} = db.getObjectAccesses(objectType)
    // accessing the request body
    let reportBody = {...req.body}
    /* beautify ignore:end */


    // retrieve body parameters: object id, report id
    const reportId = json.accessProperty(reportBody, API_REPORT_ID)
    const bodyObjectId = json.accessProperty(reportBody, API_REPORT_RESOURCE_ID)

    log.d(mod, fun, `Report for objectType: '${objectType}', report: '${json.beautify(reportBody)}'\n`)

    // ensure url object id and body object id match
    if (urlObjectId != bodyObjectId) throw new Error(`${msg.parametersMismatch(urlObjectId, bodyObjectId)}`)

    // ensure object exists
    const dbObject = await db.getObjectWithRudiId(Model, idField, urlObjectId)
    if (!dbObject) throw new Error(`${msg.objectNotFound(objectType, urlObjectId)}`)

    // ensure report doesn't exist
    const existsReport = await db.doesObjectExistWithRudiId(Report, API_REPORT_ID, reportId)
    if (existsReport) throw new Error(`${msg.objectAlreadyExists(URL_ACTION_REPORT, reportId)}`)

    // add new integration report
    const dbReadyReport = await new Report(reportBody)
    const dbActionResult = await dbReadyReport.save()
    log.i(mod, fun, `Report saved: ${json.beautify(dbReadyReport)}`)

    if (IntegrationStatus.OK == reportBody[API_REPORT_STATUS])
      await genericController.setPublishedFlag(dbObject)

    return dbReadyReport
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}

// Update an existing report for one object integration
exports.addOrEditSingleReportForObject = async (req, reply) => {
  const fun = 'addOrEditSingleReportForObject'
  log.d(mod, fun, `< PUT ${URL_OBJECT}/:${PARAM_ID}/${URL_ACTION_REPORT}`)
  try {
    // retrieve url parameters: object type, object id
    const objectType = json.accessReqParam(req, PARAM_OBJECT)
    const urlObjectId = json.accessReqParam(req, PARAM_ID)

    /* beautify ignore:start */
    // identify object model
    const {Model, idField} = db.getObjectAccesses(objectType)
    // accessing the request body
    let reportBody = {...req.body}
    /* beautify ignore:end */

    // retrieve body parameters: object id, report id
    const reportId = json.accessProperty(reportBody, API_REPORT_ID)
    const bodyObjectId = json.accessProperty(reportBody, API_REPORT_RESOURCE_ID)

    // ensure url object id and body object id match
    if (urlObjectId != bodyObjectId) throw new Error(`${msg.parametersMismatch(urlObjectId, bodyObjectId)}`)

    // ensure object exists
    const existsObject = await db.doesObjectExistWithRudiId(Model, idField, urlObjectId)
    if (!existsObject) throw new Error(`${msg.objectNotFound(objectType, urlObjectId)}`)

    // check if the report exists 
    const dbReport = await db.getObjectWithRudiId(Report, API_REPORT_ID, reportId)

    let dbReadyReport
    if (!dbReport) { // adding new report
      // add new integration report
      dbReadyReport = await new Report(reportBody)
      const dbActionResult = await dbReadyReport.save()
      log.i(mod, fun, `Report created: ${json.beautify(dbReadyReport)}`)

    } else { // updating existing report
      dbReadyReport = await db.updateObject(Report, API_REPORT_ID, reportBody)
      log.i(mod, fun, `Report edited: ${json.beautify(dbReadyReport)}`)
    }

    return dbReadyReport
    // retrieve url parameters: object id
    // retrieve body parameters: object id, report id

    // ensure url object id and body object id match
    // ensure object exists
    // ensure report doesn't exist

    // update new integration report
    return `Function '${fun}' still needs to be implemented in module ${mod}`

  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}

// Get every reports for one object integration
exports.getReportListForObject = async (req, reply) => {
  const fun = 'getReportListForObject'
  log.d(mod, fun, `< GET ${URL_OBJECT}/:${PARAM_ID}/${URL_ACTION_REPORT}`)
  try {
    // retrieve url parameters: object type, object id
    const objectType = json.accessReqParam(req, PARAM_OBJECT)
    const urlObjectId = json.accessReqParam(req, PARAM_ID)

    // retrieve query parameters: 'limit' and 'offset'
    const limit = parseInt(req.query[QUERY_LIMIT]) || 0
    const offset = parseInt(req.query[QUERY_OFFSET]) || 0

    /* beautify ignore:start */
    // identify object model
    const {Model, idField} = db.getObjectAccesses(objectType)
    /* beautify ignore:end */

    // ensure object exists
    const existsObject = await db.doesObjectExistWithRudiId(Model, idField, urlObjectId)
    if (!existsObject) throw new Error(`${msg.objectNotFound(objectType, urlObjectId)}`)

    // get all reports for this object
    /* beautify ignore:start */
    const dbReportList = await db.getObjectList(Report, limit, offset, {[API_REPORT_RESOURCE_ID]: urlObjectId})
    /* beautify ignore:end */
    return dbReportList
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}

// Get every reports for one object integration
exports.getSingleReportForObject = async (req, reply) => {
  const fun = 'getSingleReportForObject'
  log.d(mod, fun, `< GET ${URL_OBJECT}/:${PARAM_ID}/${URL_ACTION_REPORT}/:${PARAM_REPORT_ID}`)
  try {

    // retrieve url parameters: object type, object id
    const objectType = json.accessReqParam(req, PARAM_OBJECT)
    const urlObjectId = json.accessReqParam(req, PARAM_ID)
    const reportId = json.accessReqParam(req, PARAM_REPORT_ID)

    /* beautify ignore:start */
    // identify object model
    const {Model, idField} = db.getObjectAccesses(objectType)
    /* beautify ignore:end */

    // ensure object exists
    const existsObject = await db.doesObjectExistWithRudiId(Model, idField, urlObjectId)
    if (!existsObject) throw new Error(`${msg.objectNotFound(objectType, urlObjectId)}`)

    // ensure report doesn't exist
    const dbReport = await db.getEnsuredObjectWithRudiId(URL_ACTION_REPORT, Report, API_REPORT_ID, reportId)

    // ensure report is for the object
    const resourceId = json.accessProperty(dbReport, API_REPORT_RESOURCE_ID)
    if (resourceId != urlObjectId) throw new Error(`${msg.objectNotFound(objectType, urlObjectId)}`)

    return dbReport
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}

// Get every reports for one object integration
exports.deleteSingleReportForObject = async (req, reply) => {
  const fun = 'deleteSingleReportForObject'
  log.d(mod, fun, `< DELETE ${URL_OBJECT}/:${PARAM_ID}/${URL_ACTION_REPORT}/:${PARAM_REPORT_ID}`)
  try {

    // retrieve url parameters: object id
    // retrieve body parameters: report id

    // ensure object exists
    // ensure report exists

    // delete this integration report for this object
    return `Function '${fun}' still needs to be implemented in module ${mod}`

  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}

// Get every reports for one object integration
exports.deleteEveryReportForObject = async (req, reply) => {
  const fun = 'deleteEveryReportForObject'
  log.d(mod, fun, `< DELETE ${URL_OBJECT}/:${PARAM_ID}/${URL_ACTION_REPORT}`)
  try {

    // retrieve url parameters: object id

    // ensure object exists

    // delete every integration report for this object
    return `Function '${fun}' still needs to be implemented in module ${mod}`

  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}

// Get every reports for one object integration
exports.deleteManyReportForObject = async (req, reply) => {
  const fun = 'deleteManyReportForObject'
  log.d(mod, fun, `< POST ${URL_OBJECT}/:${PARAM_ID}/${URL_ACTION_REPORT}/${URL_ACTION_DELETION}`)
  try {

    // retrieve url parameters: object id

    // ensure object exists

    // delete every integration report for this object
    return `Function '${fun}' still needs to be implemented in module ${mod}`

  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}

// Get every reports for one object integration
exports.getReportListForObjectType = async (req, reply) => {
  const fun = 'getReportListForObjectType'
  log.d(mod, fun, `< GET ${URL_OBJECT}/${URL_ACTION_REPORT}`)
  try {

    // delete every integration report for all objects
    return `Function '${fun}' still needs to be implemented in module ${mod}`

  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}