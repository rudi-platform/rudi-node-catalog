/*
 * This file describes the different steps followed for each 
 * action on the intergration reports submitted by the Portal
 * (for metadata as well as organizations and contacts integration)
 */

//———————————————————————————————————————————————————————————————
// External dependancies 
//———————————————————————————————————————————————————————————————
const boom = require('@hapi/boom')

const log = require('../utils/logging')
const msg = require('../utils/msg')

const db = require('../db/dbQueries')
const dbRwk = require('../db/dbReworkData')
const json = require('../utils/jsonAccess')
const lang = require('../utils/lang')

//———————————————————————————————————————————————————————————————
// Constants
//———————————————————————————————————————————————————————————————
const {
  DB_ID,
  API_METADATA_ID,
  API_ORGANIZATION_ID,
  API_CONTACT_ID,
  API_PRODUCER_PROPERTY,
  API_CONTACTS_PROPERTY,
  API_REPORT_ID,
  API_RESOURCE_ID
} = require('../db/dbFields')

const {
  PARAM_LANG: REQ_LANG,
  PARAM_ID: REQ_ID,
  REQ_OBJECT: REQ_SUBJECT,
  PARAM_REPORT_ID: REQ_REPORT_ID,
} = require('../config/confApi')

//———————————————————————————————————————————————————————————————
// Data models
//———————————————————————————————————————————————————————————————
const IntegrationReport = require('../definitions/models/IntegrationReport')
const Metadata = require('../definitions/models/Metadata')


//———————————————————————————————————————————————————————————————
// Controllers: integration report for metadata 
//———————————————————————————————————————————————————————————————

// Add a new report for one metadata integration
exports.addReportForSingleMetadata = async (req, reply) => {
  const fun = 'addReportForSingleMetadata'
  log.d(fun, ``)
  try {
    // retrieve url parameters: lang, metadata id
    lang.setLanguage(json.accessParam(req.params, REQ_LANG))

    const dataId = json.accessParam(req.params, REQ_ID)

    // retrieve body parameters: metadata id, report id

    /* beautify ignore:start */
    const incomingData = {...req.body}
    /* beautify ignore:end */

    const bodyDataId = json.accessProperty(incomingData,API_RESOURCE_ID)
    const reportId = json.accessProperty(incomingData,API_REPORT_ID)

    // ensure url metadata id and body metadata id match
    if(dataId != bodyDataId){
      throw new Error(msg.parametersMismatch(dataId, bodyDataId))
    }

    // ensure metadata exists
    if (! await db.doesObjectExistWithRudiId(Metadata, API_METADATA_ID, bodyDataId)) {
      throw new Error(`${msg.metadataNotFound(bodyDataId)}`)
    }

    // ensure report doesn't exist
    if (await db.doesObjectExistWithRudiId(IntegrationReport, API_REPORT_ID, reportId)) {
      throw new Error(`${msg.reportAlreadyExists(reportId)}`)
    }

    // add new integration report
    const newReport = new IntegrationReport(incomingData)
    const report = await newReport.save()

    return report
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

// Update an existing report for one metadata integration
exports.updateReportForSingleMetadata = async (req, reply) => {
  const fun = 'updateReportForSingleMetadata'
  log.d(fun, ``)
  try {
    lang.setLanguage(req.params[REQ_LANG])

    /* beautify ignore:start */
    let incomingData = {...req.body}
    /* beautify ignore:end */

    // retrieve url parameters: lang, metadata id
    // retrieve body parameters: metadata id, report id

    // ensure url metadata id and body metadata id match
    // ensure metadata exists
    // ensure report doesn't exist

    // update new integration report
    return `Function '${fun}' still needs to be implemented`

  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

// Get every reports for one metadata integration
exports.getEveryReportForSingleMetadata = async (req, reply) => {
  const fun = 'getEveryReportForSingleMetadata'
  log.d(fun, ``)
  try {
    lang.setLanguage(req.params[REQ_LANG])

    /* beautify ignore:start */
    let incomingData = {...req.body}
    /* beautify ignore:end */

    // retrieve url parameters: lang, metadata id

    // ensure metadata exists

    // get all reports for this metadata
    return `Function '${fun}' still needs to be implemented`

  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

// Get every reports for one metadata integration
exports.getSingleReportForSingleMetadata = async (req, reply) => {
  const fun = 'getSingleReportForSingleMetadata'
  log.d(fun, ``)
  try {
    lang.setLanguage(req.params[REQ_LANG])

    /* beautify ignore:start */
    let incomingData = {...req.body}
    /* beautify ignore:end */

    // retrieve url parameters: lang, metadata id, report id

    // ensure metadata exists
    // ensure report exists

    // get this report for this metadata
    return `Function '${fun}' still needs to be implemented`

  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

// Get every reports for one metadata integration
exports.getEveryReportForEveryMetadata = async (req, reply) => {
  const fun = 'getEveryReportForEveryMetadata'
  log.d(fun, ``)
  try {
    lang.setLanguage(req.params[REQ_LANG])

    /* beautify ignore:start */
    let incomingData = {...req.body}
    /* beautify ignore:end */

    // retrieve url parameters: lang

    // get every integration report for all metadata
    return `Function '${fun}' still needs to be implemented`

  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

// Get every reports for one metadata integration
exports.deleteEveryReportForSingleMetadata = async (req, reply) => {
  const fun = 'deleteEveryReportForSingleMetadata'
  log.d(fun, ``)
  try {
    lang.setLanguage(req.params[REQ_LANG])

    /* beautify ignore:start */
    let incomingData = {...req.body}
    /* beautify ignore:end */

    // retrieve url parameters: lang, metadata id

    // ensure metadata exists

    // delete every integration report for this metadata
    return `Function '${fun}' still needs to be implemented`

  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

// Get every reports for one metadata integration
exports.deleteSingleReportForSingleMetadata = async (req, reply) => {
  const fun = 'deleteSingleReportForSingleMetadata'
  log.d(fun, ``)
  try {
    lang.setLanguage(req.params[REQ_LANG])

    /* beautify ignore:start */
    let incomingData = {...req.body}
    /* beautify ignore:end */

    // retrieve url parameters: lang, metadata id
    // retrieve body parameters: report id

    // ensure metadata exists
    // ensure report exists

    // delete this integration report for this metadata
    return `Function '${fun}' still needs to be implemented`

  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

// Get every reports for one metadata integration
exports.deleteEveryReportForEveryMetadata = async (req, reply) => {
  const fun = 'deleteEveryReportForEveryMetadata'
  log.d(fun, ``)
  try {
    lang.setLanguage(req.params[REQ_LANG])

    /* beautify ignore:start */
    let incomingData = {...req.body}
    /* beautify ignore:end */

    // delete every integration report for all metadata
    return `Function '${fun}' still needs to be implemented`

  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}


//———————————————————————————————————————————————————————————————
// Controllers: integration report for any subject 
//———————————————————————————————————————————————————————————————

// Add a new report for one subject integration
exports.addReportForSingleSubject = async (req, reply) => {
  const fun = 'addReportForSingleSubject'
  log.d(fun, ``)
  try {
    lang.setLanguage(req.params[REQ_LANG])

    /* beautify ignore:start */
    let incomingData = {...req.body}
    /* beautify ignore:end */

    // retrieve url parameters: subject id
    // retrieve body parameters: subject id, report id

    // ensure url subject id and body subject id match
    // ensure subject exists
    // ensure report doesn't exist

    // add new integration report
    return `Function '${fun}' still needs to be implemented`
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

// Update an existing report for one subject integration
exports.updateReportForSingleSubject = async (req, reply) => {
  const fun = 'updateReportForSingleSubject'
  log.d(fun, ``)
  try {
    lang.setLanguage(req.params[REQ_LANG])

    /* beautify ignore:start */
    let incomingData = {...req.body}
    /* beautify ignore:end */

    // retrieve url parameters: subject id
    // retrieve body parameters: subject id, report id

    // ensure url subject id and body subject id match
    // ensure subject exists
    // ensure report doesn't exist

    // update new integration report
    return `Function '${fun}' still needs to be implemented`

  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

// Get every reports for one subject integration
exports.getEveryReportForSingleSubject = async (req, reply) => {
  const fun = 'getEveryReportForSingleSubject'
  log.d(fun, ``)
  try {
    lang.setLanguage(req.params[REQ_LANG])

    /* beautify ignore:start */
    let incomingData = {...req.body}
    /* beautify ignore:end */

    // retrieve url parameters: subject id

    // ensure subject exists

    // get all reports for this subject
    return `Function '${fun}' still needs to be implemented`

  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

// Get every reports for one subject integration
exports.getSingleReportForSingleSubject = async (req, reply) => {
  const fun = 'getSingleReportForSingleSubject'
  log.d(fun, ``)
  try {
    lang.setLanguage(req.params[REQ_LANG])

    /* beautify ignore:start */
    let incomingData = {...req.body}
    /* beautify ignore:end */

    // retrieve url parameters: subject id, report id

    // ensure subject exists
    // ensure report exists

    // get this report for this subject
    return `Function '${fun}' still needs to be implemented`

  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

// Get every reports for one subject integration
exports.getEveryReportForEverySubject = async (req, reply) => {
  const fun = 'getEveryReportForEverySubject'
  log.d(fun, ``)
  try {
    lang.setLanguage(req.params[REQ_LANG])

    /* beautify ignore:start */
    let incomingData = {...req.body}
    /* beautify ignore:end */

    // get every integration report for all subjects
    return `Function '${fun}' still needs to be implemented`

  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

// Get every reports for one subject integration
exports.deleteEveryReportForSingleSubject = async (req, reply) => {
  const fun = 'deleteEveryReportForSingleSubject'
  log.d(fun, ``)
  try {
    lang.setLanguage(req.params[REQ_LANG])

    /* beautify ignore:start */
    let incomingData = {...req.body}
    /* beautify ignore:end */

    // retrieve url parameters: subject id

    // ensure subject exists

    // delete every integration report for this subject
    return `Function '${fun}' still needs to be implemented`

  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

// Get every reports for one subject integration
exports.deleteSingleReportForSingleSubject = async (req, reply) => {
  const fun = 'deleteSingleReportForSingleSubject'
  log.d(fun, ``)
  try {
    lang.setLanguage(req.params[REQ_LANG])

    /* beautify ignore:start */
    let incomingData = {...req.body}
    /* beautify ignore:end */

    // retrieve url parameters: subject id
    // retrieve body parameters: report id

    // ensure subject exists
    // ensure report exists

    // delete this integration report for this subject
    return `Function '${fun}' still needs to be implemented`

  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

// Get every reports for one subject integration
exports.deleteEveryReportForEverySubject = async (req, reply) => {
  const fun = 'deleteEveryReportForEverySubject'
  log.d(fun, ``)
  try {
    lang.setLanguage(req.params[REQ_LANG])

    /* beautify ignore:start */
    let incomingData = {...req.body}
    /* beautify ignore:end */

    // delete every integration report for all subjects
    return `Function '${fun}' still needs to be implemented`

  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}