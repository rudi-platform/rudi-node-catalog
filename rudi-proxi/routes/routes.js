'use strict'

const mod = 'routes'

// -----------------------------------------------------------------------------
// External dependencies
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// Internal dependencies
// -----------------------------------------------------------------------------
const log = require('../utils/logging')

// -----------------------------------------------------------------------------
// Swagger documentation
// -----------------------------------------------------------------------------
// const documentation = require('./documentation/metadataApi')

// -----------------------------------------------------------------------------
// API request constants
// -----------------------------------------------------------------------------
const {
  URL_PREFIX_PUBLIC,
  URL_PUB_METADATA,
  URL_PREFIX_PRIVATE,
  URL_PV_DB_ACCESS,
  URL_PV_LOGS_ACCESS,
  URL_PV_GIT_HASH_ACCESS,
  URL_PV_APP_HASH_ACCESS,
  URL_PV_THESAURUS_ACCESS,
  URL_PV_NODE_VERSION_ACCESS,
  URL_PV_LICENCE_ACCESS,
  URL_PV_LICENCE_CODES_ACCESS,
  URL_PV_PORTAL_PREFIX,
  URL_PV_OBJECT_GENERIC,
  URL_SUFFIX_TOKEN_GET,
  URL_SUFFIX_TOKEN_CHECK,
  PARAM_ID,
  PARAM_REPORT_ID,
  PARAM_LOGS_LINES,
  PARAM_THESAURUS_CODE,
  PARAM_OBJECT_METADATA,
  PARAM_ACTION_INIT,
  PARAM_ACTION_REPORT,
  PARAM_ACTION_DELETION,
  PARAM_ACTION_UUID_GEN,
  PARAM_ACTION_UNLINKED,
  PARAM_ACTION_SIGN,
} = require('../config/confApi')

// -----------------------------------------------------------------------------
// Controllers
// -----------------------------------------------------------------------------
const genericController = require('../controllers/genericController')
const metadataController = require('../controllers/metadataController')
const reportController = require('../controllers/reportController')

const dbController = require('../controllers/dbController')
const sysController = require('../controllers/sysController')
const { getLastLogLines, getLogs } = require('../controllers/logController')
const skosController = require('../controllers/skosController')
const licenceController = require('../controllers/licenceController')

const devController = require('../controllers/testController')
const portalController = require('../controllers/portalController')
const { forgeToken } = require('../controllers/tokenController')

// -----------------------------------------------------------------------------
// Helper functions
// -----------------------------------------------------------------------------

async function onPublicRoute(req, res) {
  const fun = 'onPublicRoute'
  log.d(mod, fun, `${req.ip}: ${req.method} ${req.url} `)
  return
}

async function onPrivateRoute(req, res) {
  const fun = 'onPrivateRoute'
  log.d(mod, fun, `${req.ip}: ${req.method} ${req.url} `)
  return
}

async function onDevRoute(req, res) {
  const fun = 'onDevRoute'
  log.d(mod, fun, `${req.ip}: ${req.method} ${req.url} `)
  return
}

// -----------------------------------------------------------------------------
// Public routes
// -----------------------------------------------------------------------------
const PUB_ROUTE_01 = 'get_all_metadata'
const PUB_ROUTE_02 = 'get_one_metadata'
const PUB_ROUTE_03 = 'upsert_one_report'
const PUB_ROUTE_04 = 'get_all_obj_report'
const PUB_ROUTE_05 = 'get_one_obj_report'

exports.publicRoutes = [
  // Routes accessed by RUDI Portal:
  // /resources POST/PUT/GET
  // /resources/{id} GET/DELETE
  // /resources/{id}/report PUT

  // -----------------------------------------------------------------------------
  // Generic routes for accessing any object
  // ('Metadata', 'Organizations' and 'Contacts')
  // -----------------------------------------------------------------------------
  // Get all
  {
    method: 'GET',
    url: URL_PUB_METADATA,
    preHandler: onPublicRoute,
    handler: metadataController.getMetadataList,
    config: { routeName: PUB_ROUTE_01 },
  },
  // Get 1
  {
    method: 'GET',
    url: `${URL_PUB_METADATA}/:${PARAM_ID}`,
    preHandler: onPublicRoute,
    handler: metadataController.getSingleMetadata,
    config: { routeName: PUB_ROUTE_02 },
  },

  // -----------------------------------------------------------------------------
  // Integration reports for one particular object
  // -----------------------------------------------------------------------------

  // Add/edit 1 report for one object integration
  {
    method: 'PUT',
    url: `${URL_PUB_METADATA}/:${PARAM_ID}/${PARAM_ACTION_REPORT}`,
    preHandler: onPublicRoute,
    handler: reportController.addOrEditSingleReportForMetadata,
    config: { routeName: PUB_ROUTE_03 },
  },

  // Get all reports for one object integration
  {
    method: 'GET',
    url: `${URL_PUB_METADATA}/:${PARAM_ID}/${PARAM_ACTION_REPORT}`,
    preHandler: onPublicRoute,
    handler: reportController.getReportListForMetadata,
    config: { routeName: PUB_ROUTE_04 },
  },
  // Get 1 report for one object integration
  {
    method: 'GET',
    url: `${URL_PUB_METADATA}/:${PARAM_ID}/${PARAM_ACTION_REPORT}/:${PARAM_REPORT_ID}`,
    preHandler: onPublicRoute,
    handler: reportController.getSingleReportForMetadata,
    config: { routeName: PUB_ROUTE_05 },
  },
]

// -----------------------------------------------------------------------------
// Private routes
// -----------------------------------------------------------------------------
const PRV_ROUTE_01 = 'add_one'
const PRV_ROUTE_02 = 'upsert_one'
const PRV_ROUTE_03 = 'get_all'
const PRV_ROUTE_04 = 'get_one'
const PRV_ROUTE_05 = 'del_one'
const PRV_ROUTE_06 = 'del_many'
const PRV_ROUTE_07 = 'del_list'
const PRV_ROUTE_08 = 'get_orphans'
const PRV_ROUTE_09 = 'add_obj_report'
const PRV_ROUTE_10 = 'upsert_obj_report'
const PRV_ROUTE_11 = 'get_obj_report_list'
const PRV_ROUTE_12 = 'get_one_obj_report'
const PRV_ROUTE_13 = 'get_all_obj_report'
const PRV_ROUTE_14 = 'del_obj_report'
const PRV_ROUTE_15 = 'del_all_obj_report'
const PRV_ROUTE_16 = 'del_list_obj_report'

exports.backOfficeRoutes = [
  // -----------------------------------------------------------------------------
  // Generic routes for accessing any object
  // ('Metadata', 'Organizations' and 'Contacts')
  // -----------------------------------------------------------------------------

  // Add 1
  {
    method: 'POST',
    url: URL_PV_OBJECT_GENERIC,
    preHandler: onPrivateRoute,
    handler: genericController.addSingleObject,
    config: { routeName: PRV_ROUTE_01 },
    // schema: documentation.addMetadataSchema
  },
  // Edit 1
  {
    method: 'PUT',
    url: URL_PV_OBJECT_GENERIC,
    preHandler: onPrivateRoute,
    handler: genericController.upsertSingleObject,
    config: { routeName: PRV_ROUTE_02 },
  },
  // Get all
  {
    method: 'GET',
    url: URL_PV_OBJECT_GENERIC,
    preHandler: onPrivateRoute,
    handler: genericController.getObjectList,
    config: { routeName: PRV_ROUTE_03 },
  },
  // Get 1
  {
    method: 'GET',
    url: `${URL_PV_OBJECT_GENERIC}/:${PARAM_ID}`,
    preHandler: onPrivateRoute,
    handler: genericController.getSingleObject,
    config: { routeName: PRV_ROUTE_04 },
  },

  // Delete 1
  {
    method: 'DELETE',
    url: `${URL_PV_OBJECT_GENERIC}/:${PARAM_ID}`,
    preHandler: onPrivateRoute,
    handler: genericController.deleteSingleObject,
    config: { routeName: PRV_ROUTE_05 },
  },
  // Delete all
  {
    method: 'DELETE',
    url: URL_PV_OBJECT_GENERIC,
    preHandler: onPrivateRoute,
    handler: genericController.deleteManyObjects,
    config: { routeName: PRV_ROUTE_06 },
  },
  // Delete many
  {
    method: 'POST',
    url: `${URL_PV_OBJECT_GENERIC}/${PARAM_ACTION_DELETION}`,
    preHandler: onPrivateRoute,
    handler: genericController.deleteObjectList,
    config: { routeName: PRV_ROUTE_07 },
  },

  // Access unlinked data
  {
    method: 'GET',
    url: `${URL_PV_OBJECT_GENERIC}/${PARAM_ACTION_UNLINKED}`,
    preHandler: onPrivateRoute,
    handler: genericController.getOrphans,
    config: { routeName: PRV_ROUTE_08 },
  },

  // -----------------------------------------------------------------------------
  // Integration reports
  // -----------------------------------------------------------------------------

  // Add 1 integration report for an identified object
  {
    method: 'POST',
    url: `${URL_PV_OBJECT_GENERIC}/:${PARAM_ID}/${PARAM_ACTION_REPORT}`,
    preHandler: onPrivateRoute,
    handler: reportController.addSingleReportForObject,
    config: { routeName: PRV_ROUTE_09 },
  },

  // Add/edit 1 integration report for an identified object
  {
    method: 'PUT',
    url: `${URL_PV_OBJECT_GENERIC}/:${PARAM_ID}/${PARAM_ACTION_REPORT}`,
    preHandler: onPrivateRoute,
    handler: reportController.addOrEditSingleReportForObject,
    config: { routeName: PRV_ROUTE_10 },
  },

  // Get all integration reports for an identified object
  {
    method: 'GET',
    url: `${URL_PV_OBJECT_GENERIC}/:${PARAM_ID}/${PARAM_ACTION_REPORT}`,
    preHandler: onPrivateRoute,
    handler: reportController.getReportListForObject,
    config: { routeName: PRV_ROUTE_11 },
  },
  // Get 1 report for one object integration
  {
    method: 'GET',
    url: `${URL_PV_OBJECT_GENERIC}/:${PARAM_ID}/${PARAM_ACTION_REPORT}/:${PARAM_REPORT_ID}`,
    preHandler: onPrivateRoute,
    handler: reportController.getSingleReportForObject,
    config: { routeName: PRV_ROUTE_12 },
  },
  // Get all integration reports for one object type
  {
    method: 'GET',
    url: `${URL_PV_OBJECT_GENERIC}/${PARAM_ACTION_REPORT}`,
    preHandler: onPrivateRoute,
    handler: reportController.getReportListForObjectType,
    config: { routeName: PRV_ROUTE_13 },
  },

  // Delete 1 identified integration report for one object
  {
    method: 'DELETE',
    url: `${URL_PV_OBJECT_GENERIC}/:${PARAM_ID}/${PARAM_ACTION_REPORT}/:${PARAM_REPORT_ID}`,
    preHandler: onPrivateRoute,
    handler: reportController.deleteSingleReportForObject,
    config: { routeName: PRV_ROUTE_14 },
  },
  // Delete all integration reports for one object
  {
    method: 'DELETE',
    url: `${URL_PV_OBJECT_GENERIC}/:${PARAM_ID}/${PARAM_ACTION_REPORT}`,
    preHandler: onPrivateRoute,
    handler: reportController.deleteEveryReportForObject,
    config: { routeName: PRV_ROUTE_15 },
  },
  // Delete many integration reports for an identified object
  {
    method: 'POST',
    url: `${URL_PV_OBJECT_GENERIC}/:${PARAM_ID}/${PARAM_ACTION_REPORT}/${PARAM_ACTION_DELETION}`,
    preHandler: onPrivateRoute,
    handler: reportController.deleteManyReportForObject,
    config: { routeName: PRV_ROUTE_16 },
  },
]

// -----------------------------------------------------------------------------
// Ext. application routes
// -----------------------------------------------------------------------------
exports.devRoutes = [
  // -----------------------------------------------------------------------------
  // Accessing thesaurus
  // -----------------------------------------------------------------------------
  {
    method: 'GET',
    url: `${URL_PV_THESAURUS_ACCESS}`,
    preHandler: onDevRoute,
    handler: skosController.getEveryThesaurus,
    config: { routeName: 'getEveryThesaurus' },
  },
  {
    method: 'GET',
    url: `${URL_PV_THESAURUS_ACCESS}/:${PARAM_THESAURUS_CODE}`,
    preHandler: onDevRoute,
    handler: skosController.getSingleThesaurus,
    config: { routeName: 'getSingleThesaurus' },
  },
  {
    method: 'GET',
    url: `${URL_PV_LICENCE_ACCESS}`,
    preHandler: onDevRoute,
    handler: licenceController.getAllLicences,
    config: { routeName: 'getAllLicences' },
  },
  {
    method: 'GET',
    url: `${URL_PV_LICENCE_CODES_ACCESS}`,
    preHandler: onDevRoute,
    handler: licenceController.getAllLicenceCodes,
    config: { routeName: 'getAllLicenceCodes' },
  },
  {
    method: 'POST',
    url: `${URL_PV_LICENCE_ACCESS}/${PARAM_ACTION_INIT}`,
    preHandler: onDevRoute,
    handler: licenceController.initLicences,
    config: { routeName: 'initLicences' },
  },

  // -----------------------------------------------------------------------------
  // Init Open Data Rennes
  // -----------------------------------------------------------------------------
  // Mass init with ODS data
  {
    method: 'POST',
    url: `${URL_PREFIX_PRIVATE}/${PARAM_OBJECT_METADATA}/${PARAM_ACTION_INIT}`,
    preHandler: onDevRoute,
    handler: metadataController.initWithODR,
    config: { routeName: 'initWithODR' },
  },

  // -----------------------------------------------------------------------------
  // UUID v4 generation
  // -----------------------------------------------------------------------------
  {
    method: 'GET',
    url: `${URL_PREFIX_PRIVATE}/${PARAM_ACTION_UUID_GEN}`,
    preHandler: onDevRoute,
    handler: genericController.generateUUID,
    config: { routeName: 'generateUUID' },
  },
  // -----------------------------------------------------------------------------
  // Local token generation
  // -----------------------------------------------------------------------------
  {
    method: 'POST',
    url: `${URL_PREFIX_PRIVATE}/${PARAM_ACTION_SIGN}`,
    preHandler: onDevRoute,
    handler: forgeToken,
    config: { routeName: 'forgeToken' },
  },
  // -----------------------------------------------------------------------------
  // Portal token
  // -----------------------------------------------------------------------------
  // Get a new token from the Portal
  {
    method: 'GET',
    url: `${URL_PV_PORTAL_PREFIX}/${URL_SUFFIX_TOKEN_GET}`,
    preHandler: onDevRoute,
    handler: portalController.exposedGetPortalToken,
    config: { routeName: 'exposedGetPortalToken' },
  },
  // Get a token checked by the Portal
  {
    method: 'GET',
    url: `${URL_PV_PORTAL_PREFIX}/${URL_SUFFIX_TOKEN_GET}/${URL_SUFFIX_TOKEN_CHECK}`,
    preHandler: onDevRoute,
    handler: portalController.checkStoredToken,
    config: { routeName: 'checkStoredToken' },
  },

  // -----------------------------------------------------------------------------
  // Get/post resources from/to Portal
  // -----------------------------------------------------------------------------
  {
    method: 'GET',
    url: `${URL_PV_PORTAL_PREFIX}/${PARAM_OBJECT_METADATA}/:${PARAM_ID}`,
    preHandler: onDevRoute,
    handler: portalController.getMetadata,
    config: { routeName: 'getPortalMetadata' },
  },
  {
    method: 'POST',
    url: `${URL_PV_PORTAL_PREFIX}/${PARAM_OBJECT_METADATA}/:${PARAM_ID}`,
    preHandler: onDevRoute,
    handler: portalController.sendMetadata,
    config: { routeName: 'sendMetadataToPortal' },
  },
  {
    method: 'DELETE',
    url: `${URL_PV_PORTAL_PREFIX}/${PARAM_OBJECT_METADATA}/:${PARAM_ID}`,
    preHandler: onDevRoute,
    handler: portalController.deleteMetadata,
    config: { routeName: 'deletePortalMetadata' },
  },

  // -----------------------------------------------------------------------------
  // Accessing app info (git hash)
  // -----------------------------------------------------------------------------
  /**
   * Get current git hash
   */
  {
    method: 'GET',
    url: `${URL_PV_GIT_HASH_ACCESS}`,
    preHandler: onDevRoute,
    handler: sysController.getGitHash,
    config: { routeName: 'getGitHash' },
  },
  /**
   * Get current git hash from the running application
   */
  {
    method: 'GET',
    url: `${URL_PV_APP_HASH_ACCESS}`,
    preHandler: onDevRoute,
    handler: sysController.getAppHash,
    config: { routeName: 'getAppHash' },
  },
  /**
   * Get node and npm versions
   */
  {
    method: 'GET',
    url: `${URL_PV_NODE_VERSION_ACCESS}`,
    preHandler: onDevRoute,
    handler: sysController.getNodeVersion,
    config: { routeName: 'getNodeVersion' },
  },

  // -----------------------------------------------------------------------------
  // Accessing logs
  // -----------------------------------------------------------------------------
  {
    method: 'GET',
    url: `${URL_PV_LOGS_ACCESS}`,
    preHandler: onDevRoute,
    handler: getLogs,
    config: { routeName: 'getLogs' },
  },
  {
    method: 'GET',
    url: `${URL_PV_LOGS_ACCESS}/:${PARAM_LOGS_LINES}`,
    preHandler: onDevRoute,
    handler: getLastLogLines,
    config: { routeName: 'getLastLogLines' },
  },

  // -----------------------------------------------------------------------------
  // Actions on DB
  // -----------------------------------------------------------------------------
  // Get all collections
  {
    method: 'GET',
    url: `${URL_PV_DB_ACCESS}`,
    preHandler: onDevRoute,
    handler: dbController.getCollections,
    config: { routeName: 'getCollections' },
  },
  // Drop DB
  {
    method: 'DELETE',
    url: `${URL_PV_DB_ACCESS}`,
    preHandler: onDevRoute,
    handler: dbController.dropDB,
    config: { routeName: 'dropDB' },
  },
  // -----------------------------------------------------------------------------
  // Tests entry
  // -----------------------------------------------------------------------------
  {
    method: 'GET',
    url: `${URL_PREFIX_PRIVATE}/test`,
    preHandler: onDevRoute,
    handler: devController.test,
    config: { routeName: 'test' },
  },
]
