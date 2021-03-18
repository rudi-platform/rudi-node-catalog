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
// Request inspector
//———————————————————————————————————————————————————————————————
exports.inspectRequest = async (req, reply) => {
  const fun = 'inspectRequest'
  log.d(mod, fun, `method: ${json.beautify(req.method)}`)
  log.d(mod, fun, `url: ${json.beautify(req.url)}`)
  log.d(mod, fun, `routerMethod: ${json.beautify(req.routerMethod)}`)
  log.d(mod, fun, `routerPath: ${json.beautify(req.routerPath)}`)
  log.d(mod, fun, `params: ${json.beautify(req.params)}`)
  log.d(mod, fun, `body: ${json.beautify(req.body)}`)
  log.d(mod, fun, `query: ${json.beautify(req.query)}`)
  log.d(mod, fun, `headers: ${json.beautify(req.headers)}`)
  log.d(mod, fun, `id: ${json.beautify(req.id)}`)
  log.d(mod, fun, `ip: ${json.beautify(req.ip)}`)
  log.d(mod, fun, `ips: ${json.beautify(req.ips)}`)
  log.d(mod, fun, `hostname: ${json.beautify(req.hostname)}`)
  log.d(mod, fun, `protocol: ${json.beautify(req.protocol)}`)
  // log.d(mod, fun, `raw: ${json.beautify(req.req)}`)
  // log.d(mod, fun, `socket: ${util.inspect(req.socket)}`)
}
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
    preHandler: this.inspectRequest,
    handler: genericController.deleteObjectList
  },
  // Add 1
  {
    method: 'POST',
    url: URL_OBJECT,
    preHandler: this.inspectRequest,
    handler: genericController.addSingleObject
    // schema: documentation.addMetadataSchema
  },
  // Edit 1
  {
    method: 'PUT',
    url: URL_OBJECT,
    preHandler: this.inspectRequest,
    handler: genericController.updateSingleObject
  },
  // Get all
  {
    method: 'GET',
    url: URL_OBJECT,
    preHandler: this.inspectRequest,
    handler: genericController.getObjectList,
  },
  // Get 1
  {
    method: 'GET',
    url: `${URL_OBJECT}/:${PARAM_ID}`,
    preHandler: this.inspectRequest,
    handler: genericController.getSingleObject
  },

  // Delete 1
  {
    method: 'DELETE',
    url: `${URL_OBJECT}/:${PARAM_ID}`,
    preHandler: this.inspectRequest,
    handler: genericController.deleteSingleObject
  },
  // Delete all
  {
    method: 'DELETE',
    url: URL_OBJECT,
    preHandler: this.inspectRequest,
    handler: genericController.deleteEveryObject
  },

  //———————————————————————————————————————————————————————————————
  // Integration reports for one particular object
  //———————————————————————————————————————————————————————————————
  // Delete many reports for one object integration
  {
    method: 'POST',
    url: `${URL_OBJECT}/:${PARAM_ID}/${URL_ACTION_REPORT}/${URL_ACTION_DELETION}`,
    preHandler: this.inspectRequest,
    handler: reportController.deleteManyReportForObject
  },
  // Add 1 report for one object integration
  {
    method: 'POST',
    url: `${URL_OBJECT}/:${PARAM_ID}/${URL_ACTION_REPORT}`,
    preHandler: this.inspectRequest,
    handler: reportController.addSingleReportForObject
  },
  // Add/edit 1 report for one object integration
  {
    method: 'PUT',
    url: `${URL_OBJECT}/:${PARAM_ID}/${URL_ACTION_REPORT}`,
    preHandler: this.inspectRequest,
    handler: reportController.addOrEditSingleReportForObject
  },
  // Get all reports for one object integration
  {
    method: 'GET',
    url: `${URL_OBJECT}/:${PARAM_ID}/${URL_ACTION_REPORT}`,
    preHandler: this.inspectRequest,
    handler: reportController.getReportListForObject
  },
  // Get 1 report for one object integration
  {
    method: 'GET',
    url: `${URL_OBJECT}/:${PARAM_ID}/${URL_ACTION_REPORT}/:${PARAM_REPORT_ID}`,
    preHandler: this.inspectRequest,
    handler: reportController.getSingleReportForObject
  },
  // Delete 1 report for one object integration
  {
    method: 'DELETE',
    url: `${URL_OBJECT}/:${PARAM_ID}/${URL_ACTION_REPORT}/:${PARAM_REPORT_ID}`,
    preHandler: this.inspectRequest,
    handler: reportController.deleteSingleReportForObject
  },
  // Delete all reports for one object integration
  {
    method: 'DELETE',
    url: `${URL_OBJECT}/:${PARAM_ID}/${URL_ACTION_REPORT}`,
    preHandler: this.inspectRequest,
    handler: reportController.deleteEveryReportForObject
  },

  //———————————————————————————————————————————————————————————————
  // Integration reports for one object type
  //———————————————————————————————————————————————————————————————
  // Get all reports for one object integration
  {
    method: 'GET',
    url: `${URL_OBJECT}/${URL_ACTION_REPORT}`,
    preHandler: this.inspectRequest,
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
    preHandler: this.inspectRequest,
    handler: sysController.getLogs
  },

  //———————————————————————————————————————————————————————————————
  // (distant dev) Route for accessing 
  //———————————————————————————————————————————————————————————————
  {
    method: 'GET',
    url: `${URL_APP_ID_ACCESS}`,
    preHandler: this.inspectRequest,
    handler: sysController.getAppId
  },
  {
    method: 'GET',
    url: `${URL_NODE_VERSION_ACCESS}`,
    preHandler: this.inspectRequest,
    handler: sysController.getNodeVersion
  },
  //———————————————————————————————————————————————————————————————
  // (distant dev) Routes for actions on DB
  //———————————————————————————————————————————————————————————————
  // Get all collections
  {
    method: 'GET',
    url: `${URL_DB_ACCESS}`,
    preHandler: this.inspectRequest,
    handler: dbController.getCollections
  },
  // Drop DB
  {
    method: 'DELETE',
    url: `${URL_DB_ACCESS}`,
    preHandler: this.inspectRequest,
    handler: dbController.dropDB
  },

]