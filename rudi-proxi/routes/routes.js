'use strict'

// const mod = 'routes'

// -----------------------------------------------------------------------------
// External dependencies
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// Internal dependencies
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// Swagger documentation
// -----------------------------------------------------------------------------
// const documentation = require('./documentation/metadataApi')

// -----------------------------------------------------------------------------
// API request constants
// -----------------------------------------------------------------------------
const {
  URL_PREFIX_PUBLIC,
  URL_PREFIX_PRIVATE,
  URL_OBJECT_GENERIC,
  URL_OBJECT_METADATA,
  PARAM_ID,
  PARAM_REPORT_ID,
  PARAM_LOGS_LINES,
  PARAM_THESAURUS_CODE,
  URL_ACTION_INIT,
  URL_ACTION_FILTER,
  URL_ACTION_REPORT,
  URL_ACTION_DELETION,
  URL_ACTION_UUID_GEN,
  URL_DB_ACCESS,
  URL_LOGS_ACCESS,
  URL_GIT_HASH_ACCESS,
  URL_APP_HASH_ACCESS,
  URL_THESAURUS_ACCESS,
  URL_NODE_VERSION_ACCESS,
  URL_LICENCE_ACCESS,
  URL_LICENCE_CODES_ACCESS,
  URL_PORTAL_PREFIX,
  URL_TOKEN_GET,
  URL_TOKEN_CHECK,
} = require('../config/confApi')

// -----------------------------------------------------------------------------
// Controllers
// -----------------------------------------------------------------------------
const genericController = require('../controllers/genericController')
const metadataController = require('../controllers/metadataController')
const reportController = require('../controllers/reportController')

const dbController = require('../controllers/dbController')
const sysController = require('../controllers/sysController')
const skosController = require('../controllers/skosController')
const licenceController = require('../controllers/licenceController')

const devController = require('../controllers/testController')
const portalController = require('../controllers/portalController')

// -----------------------------------------------------------------------------
// Helper functions
// -----------------------------------------------------------------------------
/* function logRequest(req, res) {
  const fun = 'logRequest'
  utils.consoleLog('', fun, `${req.ip}: ${req.method} ${req.url} `)
}
 */
// -----------------------------------------------------------------------------
// Public routes
// -----------------------------------------------------------------------------
exports.publicRoutes = [
  // Routes accessed by RUDI Portal:
  // /resources POST/PUT/GET
  // /resources/{id} GET/DELETE
  // /resources/{id}/report PUT
  {
    method: 'GET',
    url: `${URL_PREFIX_PUBLIC}/${URL_ACTION_UUID_GEN}`,
    // preHandler: logRequest,
    handler: genericController.generateUUID,
  },
  // -----------------------------------------------------------------------------
  // Generic routes for accessing any object
  // ('Metadata', 'Organizations' and 'Contacts')
  // -----------------------------------------------------------------------------
  // Mass init with ODS data
  {
    method: 'POST',
    url: `${URL_PREFIX_PUBLIC}/${URL_OBJECT_METADATA}/${URL_ACTION_INIT}`,
    // preHandler: logRequest,
    handler: metadataController.init,
  },
  // Delete many
  {
    method: 'POST',
    url: `${URL_OBJECT_GENERIC}/${URL_ACTION_DELETION}`,
    // preHandler: logRequest,
    handler: genericController.deleteObjectList,
  },
  // Add 1
  {
    method: 'POST',
    url: URL_OBJECT_GENERIC,
    // preHandler: logRequest,
    handler: genericController.addSingleObject,
    // schema: documentation.addMetadataSchema
  },
  // Edit 1
  {
    method: 'PUT',
    url: URL_OBJECT_GENERIC,
    // preHandler: logRequest,
    handler: genericController.updateSingleObject,
  },
  // Get all
  {
    method: 'GET',
    url: URL_OBJECT_GENERIC,
    // preHandler: logRequest,
    handler: genericController.getObjectList,
  },
  // Filter
  {
    method: 'GET',
    url: `${URL_OBJECT_GENERIC}/${URL_ACTION_FILTER}`,
    // preHandler: logRequest,
    handler: genericController.getObjectListFiltered,
  }, // Get 1
  {
    method: 'GET',
    url: `${URL_OBJECT_GENERIC}/:${PARAM_ID}`,
    // preHandler: logRequest,
    handler: genericController.getSingleObject,
  },

  // Delete 1
  {
    method: 'DELETE',
    url: `${URL_OBJECT_GENERIC}/:${PARAM_ID}`,
    // preHandler: logRequest,
    handler: genericController.deleteSingleObject,
  },
  // Delete all
  {
    method: 'DELETE',
    url: URL_OBJECT_GENERIC,
    // preHandler: logRequest,
    handler: genericController.deleteEveryObject,
  },

  // -----------------------------------------------------------------------------
  // Integration reports for one particular object
  // -----------------------------------------------------------------------------
  // Delete many reports for one object integration
  {
    method: 'POST',
    url: `${URL_OBJECT_GENERIC}/:${PARAM_ID}/${URL_ACTION_REPORT}/${URL_ACTION_DELETION}`,
    // preHandler: logRequest,
    handler: reportController.deleteManyReportForObject,
  },
  // Add 1 report for one object integration
  {
    method: 'POST',
    url: `${URL_OBJECT_GENERIC}/:${PARAM_ID}/${URL_ACTION_REPORT}`,
    // preHandler: logRequest,
    handler: reportController.addSingleReportForObject,
  },
  // Add/edit 1 report for one object integration
  {
    method: 'PUT',
    url: `${URL_OBJECT_GENERIC}/:${PARAM_ID}/${URL_ACTION_REPORT}`,
    // preHandler: logRequest,
    handler: reportController.addOrEditSingleReportForObject,
  },
  // Get all reports for one object integration
  {
    method: 'GET',
    url: `${URL_OBJECT_GENERIC}/:${PARAM_ID}/${URL_ACTION_REPORT}`,
    // preHandler: logRequest,
    handler: reportController.getReportListForObject,
  },
  // Get 1 report for one object integration
  {
    method: 'GET',
    url: `${URL_OBJECT_GENERIC}/:${PARAM_ID}/${URL_ACTION_REPORT}/:${PARAM_REPORT_ID}`,
    // preHandler: logRequest,
    handler: reportController.getSingleReportForObject,
  },
  // Delete 1 report for one object integration
  {
    method: 'DELETE',
    url: `${URL_OBJECT_GENERIC}/:${PARAM_ID}/${URL_ACTION_REPORT}/:${PARAM_REPORT_ID}`,
    // preHandler: logRequest,
    handler: reportController.deleteSingleReportForObject,
  },
  // Delete all reports for one object integration
  {
    method: 'DELETE',
    url: `${URL_OBJECT_GENERIC}/:${PARAM_ID}/${URL_ACTION_REPORT}`,
    // preHandler: logRequest,
    handler: reportController.deleteEveryReportForObject,
  },

  // -----------------------------------------------------------------------------
  // Integration reports for one object type
  // -----------------------------------------------------------------------------
  // Get all reports for one object integration
  {
    method: 'GET',
    url: `${URL_OBJECT_GENERIC}/${URL_ACTION_REPORT}`,
    // preHandler: logRequest,
    handler: reportController.getReportListForObjectType,
  },
]

// -----------------------------------------------------------------------------
// Private routes
// -----------------------------------------------------------------------------
exports.backOfficeRoutes = [
  // -----------------------------------------------------------------------------
  // Getting Portal token
  // -----------------------------------------------------------------------------

  {
    method: 'GET',
    url: `${URL_PORTAL_PREFIX}/${URL_TOKEN_GET}`,
    // preHandler: logRequest,
    handler: portalController.exposedGetPortalToken,
  },

  {
    method: 'GET',
    url: `${URL_PORTAL_PREFIX}/${URL_TOKEN_GET}/${URL_TOKEN_CHECK}`,
    // preHandler: logRequest,
    handler: portalController.checkStoredToken,
  },

  // -----------------------------------------------------------------------------
  // Get/post resources from/to Portal
  // -----------------------------------------------------------------------------
  {
    method: 'GET',
    url: `${URL_PORTAL_PREFIX}/${URL_OBJECT_METADATA}/:${PARAM_ID}`,
    // preHandler: logRequest,
    handler: portalController.getMetadata,
  },
  {
    method: 'POST',
    url: `${URL_PORTAL_PREFIX}/${URL_OBJECT_METADATA}/:${PARAM_ID}`,
    // preHandler: logRequest,
    handler: portalController.sendMetadata,
  },

  // -----------------------------------------------------------------------------
  // (distant dev) Route for accessing logs
  // -----------------------------------------------------------------------------
  {
    method: 'GET',
    url: `${URL_LOGS_ACCESS}`,
    // preHandler: logRequest,
    handler: sysController.getLogs,
  },
  {
    method: 'GET',
    url: `${URL_LOGS_ACCESS}/:${PARAM_LOGS_LINES}`,
    // preHandler: logRequest,
    handler: sysController.getLastLogLines,
  },

  // -----------------------------------------------------------------------------
  // (distant dev) Route for accessing thesaurus
  // -----------------------------------------------------------------------------
  {
    method: 'GET',
    url: `${URL_THESAURUS_ACCESS}`,
    // preHandler: logRequest,
    handler: skosController.getEveryThesaurus,
  },
  {
    method: 'GET',
    url: `${URL_THESAURUS_ACCESS}/:${PARAM_THESAURUS_CODE}`,
    // preHandler: logRequest,
    handler: skosController.getSingleThesaurus,
  },
  {
    method: 'GET',
    url: `${URL_LICENCE_ACCESS}`,
    // preHandler: logRequest,
    handler: licenceController.getAllLicences,
  },
  {
    method: 'GET',
    url: `${URL_LICENCE_CODES_ACCESS}`,
    // preHandler: logRequest,
    handler: licenceController.getAllLicenceCodes,
  },

  // -----------------------------------------------------------------------------
  // (distant dev) Route for accessing
  // -----------------------------------------------------------------------------
  {
    method: 'GET',
    url: `${URL_GIT_HASH_ACCESS}`,
    // preHandler: logRequest,
    handler: sysController.getGitHash,
  },
  {
    method: 'GET',
    url: `${URL_APP_HASH_ACCESS}`,
    // preHandler: logRequest,
    handler: sysController.getAppHash,
  },
  {
    method: 'GET',
    url: `${URL_NODE_VERSION_ACCESS}`,
    // preHandler: logRequest,
    handler: sysController.getNodeVersion,
  },
  // -----------------------------------------------------------------------------
  // (distant dev) Routes for actions on DB
  // -----------------------------------------------------------------------------
  // Get all collections
  {
    method: 'GET',
    url: `${URL_DB_ACCESS}`,
    // preHandler: logRequest,
    handler: dbController.getCollections,
  },
  // Drop DB
  {
    method: 'DELETE',
    url: `${URL_DB_ACCESS}`,
    // preHandler: logRequest,
    handler: dbController.dropDB,
  },
]

exports.devRoutes = [
  {
    method: 'GET',
    url: `${URL_PREFIX_PRIVATE}/test`,
    // preHandler: logRequest,
    handler: devController.test,
  },
]
