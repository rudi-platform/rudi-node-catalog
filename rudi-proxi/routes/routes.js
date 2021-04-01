'use strict';

const mod = 'routes'

//———————————————————————————————————————————————————————————————
// External dependencies
//———————————————————————————————————————————————————————————————

//———————————————————————————————————————————————————————————————
// Internal dependencies
//———————————————————————————————————————————————————————————————
const log = require('../utils/logging')
const json = require('../utils/jsonAccess');

//———————————————————————————————————————————————————————————————
// Swagger documentation
//———————————————————————————————————————————————————————————————
const documentation = require('./documentation/metadataApi')

//———————————————————————————————————————————————————————————————
// API request constants
//———————————————————————————————————————————————————————————————
const {
  URL_PREFIX_PUBLIC,
  URL_OBJECT,
  PARAM_OBJECT,
  PARAM_ID,
  PARAM_REPORT_ID,
  URL_ACTION_DELETION,
  URL_ACTION_REPORT,
  URL_DB_ACCESS,
  URL_LOGS_SUFFIX,
  URL_LOGS_ACCESS,
  URL_APP_ID_ACCESS,
  URL_NODE_VERSION_ACCESS
} = require('../config/confApi')

//———————————————————————————————————————————————————————————————
// Controllers
//———————————————————————————————————————————————————————————————
const genericController = require('../controllers/genericController')
const metadataController = require('../controllers/metadataController')
const organizationController = require('../controllers/organizationController')
const contactController = require('../controllers/contactController')
const reportController = require('../controllers/reportController')

const dbController = require('../controllers/dbController');
const sysController = require('../controllers/sysController');


//———————————————————————————————————————————————————————————————
// Public routes
//———————————————————————————————————————————————————————————————
exports.publicRoutes = [

  // Routes accessed by RUDI Portal:
  // /resources POST/PUT/GET
  // /resources/{id} GET/DELETE
  // /resources/{id}/report PUT

  //———————————————————————————————————————————————————————————————
  // Generic routes for accessing any object
  // ('Metadata', 'Organizations' and 'Contacts')
  //———————————————————————————————————————————————————————————————
  // Delete many
  {
    method: 'POST',
    url: `${URL_OBJECT}/${URL_ACTION_DELETION}`,
    // preHandler: log.logRequest,
    handler: genericController.deleteObjectList
  },
  // Add 1
  {
    method: 'POST',
    url: URL_OBJECT,
    // preHandler: log.logRequest,
    handler: genericController.addSingleObject
    // schema: documentation.addMetadataSchema
  },
  // Edit 1
  {
    method: 'PUT',
    url: URL_OBJECT,
    // preHandler: log.logRequest,
    handler: genericController.updateSingleObject
  },
  // Get all
  {
    method: 'GET',
    url: URL_OBJECT,
    // preHandler: log.logRequest,
    handler: genericController.getObjectList,
  },
  // Get 1
  {
    method: 'GET',
    url: `${URL_OBJECT}/:${PARAM_ID}`,
    // preHandler: log.logRequest,
    handler: genericController.getSingleObject
  },

  // Delete 1
  {
    method: 'DELETE',
    url: `${URL_OBJECT}/:${PARAM_ID}`,
    // preHandler: log.logRequest,
    handler: genericController.deleteSingleObject
  },
  // Delete all
  {
    method: 'DELETE',
    url: URL_OBJECT,
    // preHandler: log.logRequest,
    handler: genericController.deleteEveryObject
  },

  //———————————————————————————————————————————————————————————————
  // Integration reports for one particular object
  //———————————————————————————————————————————————————————————————
  // Delete many reports for one object integration
  {
    method: 'POST',
    url: `${URL_OBJECT}/:${PARAM_ID}/${URL_ACTION_REPORT}/${URL_ACTION_DELETION}`,
    // preHandler: log.logRequest,
    handler: reportController.deleteManyReportForObject
  },
  // Add 1 report for one object integration
  {
    method: 'POST',
    url: `${URL_OBJECT}/:${PARAM_ID}/${URL_ACTION_REPORT}`,
    // preHandler: log.logRequest,
    handler: reportController.addSingleReportForObject
  },
  // Add/edit 1 report for one object integration
  {
    method: 'PUT',
    url: `${URL_OBJECT}/:${PARAM_ID}/${URL_ACTION_REPORT}`,
    // preHandler: log.logRequest,
    handler: reportController.addOrEditSingleReportForObject
  },
  // Get all reports for one object integration
  {
    method: 'GET',
    url: `${URL_OBJECT}/:${PARAM_ID}/${URL_ACTION_REPORT}`,
    // preHandler: log.logRequest,
    handler: reportController.getReportListForObject
  },
  // Get 1 report for one object integration
  {
    method: 'GET',
    url: `${URL_OBJECT}/:${PARAM_ID}/${URL_ACTION_REPORT}/:${PARAM_REPORT_ID}`,
    // preHandler: log.logRequest,
    handler: reportController.getSingleReportForObject
  },
  // Delete 1 report for one object integration
  {
    method: 'DELETE',
    url: `${URL_OBJECT}/:${PARAM_ID}/${URL_ACTION_REPORT}/:${PARAM_REPORT_ID}`,
    // preHandler: log.logRequest,
    handler: reportController.deleteSingleReportForObject
  },
  // Delete all reports for one object integration
  {
    method: 'DELETE',
    url: `${URL_OBJECT}/:${PARAM_ID}/${URL_ACTION_REPORT}`,
    // preHandler: log.logRequest,
    handler: reportController.deleteEveryReportForObject
  },

  //———————————————————————————————————————————————————————————————
  // Integration reports for one object type
  //———————————————————————————————————————————————————————————————
  // Get all reports for one object integration
  {
    method: 'GET',
    url: `${URL_OBJECT}/${URL_ACTION_REPORT}`,
    // preHandler: log.logRequest,
    handler: reportController.getReportListForObjectType
  },
]


//———————————————————————————————————————————————————————————————
// Private routes
//———————————————————————————————————————————————————————————————
exports.backOfficeRoutes = [
  //———————————————————————————————————————————————————————————————
  // (distant dev) Route for accessing logs
  //———————————————————————————————————————————————————————————————
  {
    method: 'GET',
    url: `${URL_LOGS_ACCESS}`,
    // preHandler: log.logRequest,
    handler: sysController.getLogs
  },

  //———————————————————————————————————————————————————————————————
  // (distant dev) Route for accessing 
  //———————————————————————————————————————————————————————————————
  {
    method: 'GET',
    url: `${URL_APP_ID_ACCESS}`,
    // preHandler: log.logRequest,
    handler: sysController.getAppId
  },
  {
    method: 'GET',
    url: `${URL_NODE_VERSION_ACCESS}`,
    // preHandler: log.logRequest,
    handler: sysController.getNodeVersion
  },
  //———————————————————————————————————————————————————————————————
  // (distant dev) Routes for actions on DB
  //———————————————————————————————————————————————————————————————
  // Get all collections
  {
    method: 'GET',
    url: `${URL_DB_ACCESS}`,
    // preHandler: log.logRequest,
    handler: dbController.getCollections
  },
  // Drop DB
  {
    method: 'DELETE',
    url: `${URL_DB_ACCESS}`,
    // preHandler: log.logRequest,
    handler: dbController.dropDB
  },

]