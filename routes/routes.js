'use strict'

const mod = 'routes'

// ------------------------------------------------------------------------------------------------
// External dependencies
// ------------------------------------------------------------------------------------------------

// ------------------------------------------------------------------------------------------------
// Internal dependencies
// ------------------------------------------------------------------------------------------------
const {
  shouldControlPrivateRequests,
  shouldControlPublicRequests,
} = require('../config/confSystem')

const log = require('../utils/logging')

const { RudiError } = require('../utils/errors')
const { CallContext } = require('../definitions/constructors/callContext')

// ------------------------------------------------------------------------------------------------
// Swagger documentation
// ------------------------------------------------------------------------------------------------
// const documentation = require('./documentation/metadataApi')

// ------------------------------------------------------------------------------------------------
// Controllers
// ------------------------------------------------------------------------------------------------
const genericController = require('../controllers/genericController')
const metadataController = require('../controllers/metadataController')
const reportController = require('../controllers/reportController')

const dbController = require('../controllers/dbController')
const sysController = require('../controllers/sysController')
const { getLastLogLines, getLogs } = require('../controllers/logController')
const skosController = require('../controllers/skosController')
const licenceController = require('../controllers/licenceController')

// const devController = require('../controllers/testController')
const { checkRudiProdPermission } = require('../controllers/tokenController')
const portalController = require('../controllers/portalController')

// ------------------------------------------------------------------------------------------------
// API request constants
// ------------------------------------------------------------------------------------------------
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
  URL_PV_APP_ENV_ACCESS,
  PARAM_THESAURUS_LANG,
  ROUTE_NAME,
  URL_PUB_API_VERSION,
  PARAM_ACTION_SEARCH,
} = require('../config/confApi')

const { JWT_USER, JWT_CLIENT } = require('../config/confPortal')
const { JWT_SUB } = require('../utils/crypto')

// ------------------------------------------------------------------------------------------------
// Route names
// ------------------------------------------------------------------------------------------------

const REDIRECT_GET_DATA = 'pub_redirect_metadata'
const REDIRECT_GET_PLUS = 'pub_redirect_metadata'
const REDIRECT_PUT_PLUS = 'pub_redirect_metadata'

const PUB_GET_ALL_METADATA = 'pub_get_all_metadata'
const PUB_GET_ONE_METADATA = 'pub_get_one_metadata'
const PUB_UPSERT_ONE_REPORT = 'pub_upsert_one_report'
const PUB_GET_ALL_OBJ_REPORT = 'pub_get_all_obj_report'
const PUB_GET_ONE_OBJ_REPORT = 'pub_get_one_obj_report'

const PRV_ADD_ONE = 'prv_add_one'
const PRV_UPSERT_ONE = 'prv_upsert_one'
const PRV_GET_ALL = 'prv_get_all'
const PRV_GET_ONE = 'prv_get_one'
const PRV_DEL_ONE = 'prv_del_one'
const PRV_DEL_MANY = 'prv_del_many'
const PRV_DEL_LIST = 'prv_del_list'

const PRV_RCH_OBJ = 'prv_rch_obj'
const PRV_GET_ORPHANS = 'prv_get_orphans'

const PRV_ADD_OBJ_REPORT = 'prv_add_obj_report'
const PRV_UPSERT_OBJ_REPORT = 'prv_upsert_obj_report'
const PRV_GET_OBJ_REPORT_LIST = 'prv_get_obj_report_list'
const PRV_GET_ONE_OBJ_REPORT = 'prv_get_one_obj_report'
const PRV_GET_ALL_OBJ_REPORT = 'prv_get_all_obj_report'
const PRV_DEL_OBJ_REPORT = 'prv_del_obj_report'
const PRV_DEL_ALL_OBJ_REPORT = 'prv_del_all_obj_report'
const PRV_DEL_LIST_OBJ_REPORT = 'prv_del_list_obj_report'

const DEV_GET_EVERY_THESAURUS = 'dev_get_every_thesaurus'
const DEV_GET_SINGLE_THESAURUS = 'dev_get_single_thesaurus'
const DEV_GET_ALL_LICENCES = 'dev_get_all_licences'
const DEV_GET_ALL_LICENCE_CODES = 'dev_get_all_licence_codes'
const DEV_INIT_LICENCES = 'dev_init_licences'
const DEV_INIT_WITH_ODR = 'dev_init_with_odr'
const DEV_GENERATE_UUID = 'dev_generate_uuid'
const DEV_EXPOSED_GET_PORTAL_TOKEN = 'dev_exposed_get_portal_token'
const DEV_CHECK_STORED_TOKEN = 'dev_check_stored_token'
const DEV_GET_PORTAL_METADATA = 'dev_get_portal_metadata'
const DEV_SEND_METADATA_TO_PORTAL = 'dev_send_metadata_to_portal'
const DEV_DEL_PORTAL_METADATA = 'dev_del_portal_metadata'
const DEV_GET_GIT_HASH = 'dev_get_git_hash'
const DEV_GET_APP_HASH = 'dev_get_app_hash'
const DEV_GET_API_VERSION = 'dev_get_api_version'
const DEV_GET_NODE_VERSION = 'dev_get_node_version'
const DEV_GET_APP_ENV = 'dev_get_app_env'
const DEV_GET_LOGS = 'dev_get_logs'
const DEV_GET_LAST_LOG_LINES = 'dev_get_last_log_lines'
const DEV_GET_COLLECTIONS = 'dev_get_collections'
const DEV_DROP_DB = 'dev_drop_db'

// ------------------------------------------------------------------------------------------------
// Pre-handler functions
// ------------------------------------------------------------------------------------------------
/**
 * TODO : create sysLog functions to
 *  - log incoming requests
 *  - log replies
 *  - log errors
 */
async function onFreeRoute(req, reply) {
  const fun = 'onFreeRoute'
  try {
    log.t(mod, fun, `${req.method} ${req.url} `)
    const context = CallContext.getCallContextFromReq(req)
    context.logInfo('route', fun, 'API call')
    return
  } catch (err) {
    // log.w(mod, fun, err)
    // log.sysWarn(
    //   CallContext.createApiCallMsg(req),
    //   'routes.free.err',
    //   CallContext.getReqContext(req),
    //   {
    //     error: err,
    //   }
    // )
    throw RudiError.treatError(mod, fun, err)
  }
}

async function onPublicRoute(req, reply) {
  const fun = 'onPublicRoute'
  try {
    log.t(mod, fun, `${req.method} ${req.url} `)
    if (!shouldControlPublicRequests()) return true

    const jwtPayload = (await portalController.checkPortalTokenInHeader(req, reply))[1]
    // log.d(mod, fun, `Payload: ${beautify(jwtPayload)}`)

    const context = CallContext.getCallContextFromReq(req)
    context.clientApp = jwtPayload[JWT_SUB] || 'RUDI Portal'
    context.reqUser = jwtPayload[JWT_USER] || jwtPayload[JWT_CLIENT]

    context.logInfo('route', fun, 'API call')
    return
  } catch (err) {
    // log.w(mod, fun, err)
    // log.sysWarn(
    //   CallContext.createApiCallMsg(req),
    //   'routes.pub.err',
    //   CallContext.getReqContext(req),
    //   {
    //     error: err,
    //   }
    // )
    throw RudiError.treatError(mod, fun, err)
  }
}

async function onPrivateRoute(req, reply) {
  const fun = 'onPrivateRoute'
  try {
    log.t(mod, fun, `${req.method} ${req.url} `)
    if (!shouldControlPrivateRequests()) return true

    const context = CallContext.getCallContextFromReq(req)

    const { subject, clientId } = await checkRudiProdPermission(req, reply)

    context.clientApp = subject
    context.reqUser = clientId

    context.logInfo('route', fun, 'API call')
    return
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

async function onDevRoute(req, reply) {
  const fun = 'onDevRoute'
  try {
    log.t(mod, fun, `${req.method} ${req.url} `)
    if (!shouldControlPrivateRequests()) return true

    const { subject, clientId } = await checkRudiProdPermission(req, reply)

    const context = CallContext.getCallContextFromReq(req)
    context.clientApp = subject
    context.reqUser = clientId

    context.logInfo('route', fun, 'API call')
    return
  } catch (err) {
    // log.w(mod, fun, err)
    // log.sysWarn(
    //   CallContext.createApiCallMsg(req),
    //   'routes.dev.err',
    //   CallContext.getReqContext(req),
    //   {
    //     error: err,
    //   }
    // )
    throw RudiError.treatError(mod, fun, err)
  }
  // log.d(mod, fun, `${beautify(req)}`)
}

// ------------------------------------------------------------------------------------------------
// Redirected routes
// ------------------------------------------------------------------------------------------------
exports.redirectRoutes = [
  {
    method: 'GET',
    url: `/api`,
    preHandler: onPublicRoute,
    config: { [ROUTE_NAME]: REDIRECT_GET_DATA },
    handler: function (req, reply) {
      log.d(mod, `redirect`, `${req.method} ${URL_PUB_METADATA}`)
      reply.redirect(URL_PUB_METADATA)
    },
  },
  {
    method: 'GET',
    url: URL_PREFIX_PUBLIC,
    preHandler: onPublicRoute,
    config: { [ROUTE_NAME]: REDIRECT_GET_DATA },
    handler: function (req, reply) {
      log.d(mod, `redirect`, `${req.method} ${URL_PUB_METADATA}`)
      reply.redirect(URL_PUB_METADATA)
    },
  },
  {
    method: 'GET',
    url: `/${PARAM_OBJECT_METADATA}`,
    preHandler: onPublicRoute,
    config: { [ROUTE_NAME]: REDIRECT_GET_DATA },
    handler: function (req, reply) {
      const newRoute = `${URL_PREFIX_PUBLIC}${req.url}`
      log.d(mod, `redirect`, `${req.method} ${newRoute}`)
      reply.redirect(308, newRoute)
    },
  },
  {
    method: 'GET',
    url: `/${PARAM_OBJECT_METADATA}/*`,
    preHandler: onPublicRoute,
    config: { [ROUTE_NAME]: REDIRECT_GET_PLUS },
    handler: function (req, reply) {
      const newRoute = `${URL_PREFIX_PUBLIC}${req.url}`
      log.d(mod, `redirect`, `${req.method} ${newRoute}`)
      reply.redirect(308, newRoute)
    },
  },
  {
    method: 'PUT',
    url: `/${PARAM_OBJECT_METADATA}/*`,
    preHandler: onPublicRoute,
    config: { [ROUTE_NAME]: REDIRECT_PUT_PLUS },
    handler: function (req, reply) {
      const newRoute = `${URL_PREFIX_PUBLIC}${req.url}`
      log.d(mod, `redirect`, `${req.method} ${newRoute}`)
      reply.redirect(308, newRoute)
    },
  },
]
// ------------------------------------------------------------------------------------------------
// Public routes
// ------------------------------------------------------------------------------------------------
exports.publicRoutes = [
  // Routes accessed by RUDI Portal:
  // /resources POST/PUT/GET
  // /resources/{id} GET/DELETE
  // /resources/{id}/report PUT

  // ------------------------------------------------------------------------------------------------
  // Generic routes for accessing any object
  // ('Metadata', 'Organizations' and 'Contacts')
  // ------------------------------------------------------------------------------------------------
  // Get all
  {
    method: 'GET',
    url: URL_PUB_METADATA,
    preHandler: onPublicRoute,
    handler: genericController.getMetadataListAndCount,
    config: { [ROUTE_NAME]: PUB_GET_ALL_METADATA },
  },
  // Get 1
  {
    method: 'GET',
    url: `${URL_PUB_METADATA}/:${PARAM_ID}`,
    preHandler: onPublicRoute,
    handler: metadataController.getSingleMetadata,
    config: { [ROUTE_NAME]: PUB_GET_ONE_METADATA },
  },

  // ------------------------------------------------------------------------------------------------
  // Integration reports for one particular object
  // ------------------------------------------------------------------------------------------------

  // Add/edit 1 report for one object integration
  {
    method: 'PUT',
    url: `/${PARAM_OBJECT_METADATA}/:${PARAM_ID}/${PARAM_ACTION_REPORT}`,
    preHandler: onPublicRoute,
    handler: reportController.addOrEditSingleReportForMetadata,
    config: { [ROUTE_NAME]: PUB_UPSERT_ONE_REPORT },
  },

  // Add/edit 1 report for one object integration
  {
    method: 'PUT',
    url: `${URL_PUB_METADATA}/:${PARAM_ID}/${PARAM_ACTION_REPORT}`,
    preHandler: onPublicRoute,
    handler: reportController.addOrEditSingleReportForMetadata,
    config: { [ROUTE_NAME]: PUB_UPSERT_ONE_REPORT },
  },

  // Get all reports for one object integration
  {
    method: 'GET',
    url: `${URL_PUB_METADATA}/:${PARAM_ID}/${PARAM_ACTION_REPORT}`,
    preHandler: onPublicRoute,
    handler: reportController.getReportListForMetadata,
    config: { [ROUTE_NAME]: PUB_GET_ALL_OBJ_REPORT },
  },
  // Get 1 report for one object integration
  {
    method: 'GET',
    url: `${URL_PUB_METADATA}/:${PARAM_ID}/${PARAM_ACTION_REPORT}/:${PARAM_REPORT_ID}`,
    preHandler: onPublicRoute,
    handler: reportController.getSingleReportForMetadata,
    config: { [ROUTE_NAME]: PUB_GET_ONE_OBJ_REPORT },
  },
]

// ------------------------------------------------------------------------------------------------
// Private routes
// ------------------------------------------------------------------------------------------------
exports.backOfficeRoutes = [
  // ------------------------------------------------------------------------------------------------
  // Generic routes for accessing any object
  // ('Metadata', 'Organizations' and 'Contacts')
  // ------------------------------------------------------------------------------------------------

  // Add 1
  {
    method: 'POST',
    url: URL_PV_OBJECT_GENERIC,
    preHandler: onPrivateRoute,
    handler: genericController.addSingleObject,
    config: { [ROUTE_NAME]: PRV_ADD_ONE },

    // schema: documentation.addMetadataSchema
  },
  // Edit 1
  {
    method: 'PUT',
    url: URL_PV_OBJECT_GENERIC,
    preHandler: onPrivateRoute,
    handler: genericController.upsertSingleObject,
    config: { [ROUTE_NAME]: PRV_UPSERT_ONE },
  },
  // Get all
  {
    method: 'GET',
    url: URL_PV_OBJECT_GENERIC,
    preHandler: onPrivateRoute,
    handler: genericController.getObjectList,
    config: { [ROUTE_NAME]: PRV_GET_ALL },
  },
  // Get 1
  {
    method: 'GET',
    url: `${URL_PV_OBJECT_GENERIC}/:${PARAM_ID}`,
    preHandler: onPrivateRoute,
    handler: genericController.getSingleObject,
    config: { [ROUTE_NAME]: PRV_GET_ONE },
  },

  // Delete 1
  {
    method: 'DELETE',
    url: `${URL_PV_OBJECT_GENERIC}/:${PARAM_ID}`,
    preHandler: onPrivateRoute,
    handler: genericController.deleteSingleObject,
    config: { [ROUTE_NAME]: PRV_DEL_ONE },
  },
  // Delete all
  {
    method: 'DELETE',
    url: URL_PV_OBJECT_GENERIC,
    preHandler: onPrivateRoute,
    handler: genericController.deleteManyObjects,
    config: { [ROUTE_NAME]: PRV_DEL_MANY },
  },
  // Delete many
  {
    method: 'POST',
    url: `${URL_PV_OBJECT_GENERIC}/${PARAM_ACTION_DELETION}`,
    preHandler: onPrivateRoute,
    handler: genericController.deleteObjectList,
    config: { [ROUTE_NAME]: PRV_DEL_LIST },
  },

  // Access unlinked data
  {
    method: 'GET',
    url: `${URL_PV_OBJECT_GENERIC}/${PARAM_ACTION_UNLINKED}`,
    preHandler: onPrivateRoute,
    handler: genericController.getOrphans,
    config: { [ROUTE_NAME]: PRV_GET_ORPHANS },
  },
  // Search metadata
  {
    method: 'GET',
    url: `${URL_PV_OBJECT_GENERIC}/${PARAM_ACTION_SEARCH}`,
    preHandler: onPrivateRoute,
    handler: genericController.searchObjects,
    config: { [ROUTE_NAME]: PRV_RCH_OBJ },
  },
  // ------------------------------------------------------------------------------------------------
  // Integration reports
  // ------------------------------------------------------------------------------------------------

  // Add 1 integration report for an identified object
  {
    method: 'POST',
    url: `${URL_PV_OBJECT_GENERIC}/:${PARAM_ID}/${PARAM_ACTION_REPORT}`,
    preHandler: onPrivateRoute,
    handler: reportController.addSingleReportForObject,
    config: { [ROUTE_NAME]: PRV_ADD_OBJ_REPORT },
  },

  // Add/edit 1 integration report for an identified object
  {
    method: 'PUT',
    url: `${URL_PV_OBJECT_GENERIC}/:${PARAM_ID}/${PARAM_ACTION_REPORT}`,
    preHandler: onPrivateRoute,
    handler: reportController.addOrEditSingleReportForObject,
    config: { [ROUTE_NAME]: PRV_UPSERT_OBJ_REPORT },
  },

  // Get all integration reports for an identified object
  {
    method: 'GET',
    url: `${URL_PV_OBJECT_GENERIC}/:${PARAM_ID}/${PARAM_ACTION_REPORT}`,
    preHandler: onPrivateRoute,
    handler: reportController.getReportListForObject,
    config: { [ROUTE_NAME]: PRV_GET_OBJ_REPORT_LIST },
  },
  // Get 1 report for one object integration
  {
    method: 'GET',
    url: `${URL_PV_OBJECT_GENERIC}/:${PARAM_ID}/${PARAM_ACTION_REPORT}/:${PARAM_REPORT_ID}`,
    preHandler: onPrivateRoute,
    handler: reportController.getSingleReportForObject,
    config: { [ROUTE_NAME]: PRV_GET_ONE_OBJ_REPORT },
  },
  // Get all integration reports for one object type
  {
    method: 'GET',
    url: `${URL_PV_OBJECT_GENERIC}/${PARAM_ACTION_REPORT}`,
    preHandler: onPrivateRoute,
    handler: reportController.getReportListForObjectType,
    config: { [ROUTE_NAME]: PRV_GET_ALL_OBJ_REPORT },
  },

  // Delete 1 identified integration report for one object
  {
    method: 'DELETE',
    url: `${URL_PV_OBJECT_GENERIC}/:${PARAM_ID}/${PARAM_ACTION_REPORT}/:${PARAM_REPORT_ID}`,
    preHandler: onPrivateRoute,
    handler: reportController.deleteSingleReportForObject,
    config: { [ROUTE_NAME]: PRV_DEL_OBJ_REPORT },
  },
  // Delete all integration reports for one object
  {
    method: 'DELETE',
    url: `${URL_PV_OBJECT_GENERIC}/:${PARAM_ID}/${PARAM_ACTION_REPORT}`,
    preHandler: onPrivateRoute,
    handler: reportController.deleteEveryReportForObject,
    config: { [ROUTE_NAME]: PRV_DEL_ALL_OBJ_REPORT },
  },
  // Delete many integration reports for an identified object
  {
    method: 'POST',
    url: `${URL_PV_OBJECT_GENERIC}/:${PARAM_ID}/${PARAM_ACTION_REPORT}/${PARAM_ACTION_DELETION}`,
    preHandler: onPrivateRoute,
    handler: reportController.deleteManyReportForObject,
    config: { [ROUTE_NAME]: PRV_DEL_LIST_OBJ_REPORT },
  },
]

// ------------------------------------------------------------------------------------------------
// External application/module routes
// ------------------------------------------------------------------------------------------------
exports.devRoutes = [
  // ------------------------------------------------------------------------------------------------
  // Accessing thesaurus
  // ------------------------------------------------------------------------------------------------
  {
    method: 'GET',
    url: `${URL_PV_THESAURUS_ACCESS}`,
    preHandler: onDevRoute,
    handler: skosController.getEveryThesaurus,
    config: { [ROUTE_NAME]: DEV_GET_EVERY_THESAURUS },
  },
  {
    method: 'GET',
    url: `${URL_PV_THESAURUS_ACCESS}/:${PARAM_THESAURUS_CODE}`,
    preHandler: onDevRoute,
    handler: skosController.getSingleThesaurus,
    config: { [ROUTE_NAME]: DEV_GET_SINGLE_THESAURUS },
  },
  {
    method: 'GET',
    url: `${URL_PV_THESAURUS_ACCESS}/:${PARAM_THESAURUS_CODE}/:${PARAM_THESAURUS_LANG}`,
    preHandler: onDevRoute,
    handler: skosController.getSingleThesaurusLabels,
    config: { [ROUTE_NAME]: DEV_GET_SINGLE_THESAURUS },
  },
  {
    method: 'GET',
    url: `${URL_PV_LICENCE_ACCESS}`,
    preHandler: onDevRoute,
    handler: licenceController.getAllLicences,
    config: { [ROUTE_NAME]: DEV_GET_ALL_LICENCES },
  },
  {
    method: 'GET',
    url: `${URL_PV_LICENCE_CODES_ACCESS}`,
    preHandler: onDevRoute,
    handler: licenceController.getAllLicenceCodes,
    config: { [ROUTE_NAME]: DEV_GET_ALL_LICENCE_CODES },
  },
  {
    method: 'POST',
    url: `${URL_PV_LICENCE_ACCESS}/${PARAM_ACTION_INIT}`,
    preHandler: onDevRoute,
    handler: licenceController.initLicences,
    config: { [ROUTE_NAME]: DEV_INIT_LICENCES },
  },

  // ------------------------------------------------------------------------------------------------
  // Init Open Data Rennes
  // ------------------------------------------------------------------------------------------------
  // Mass init with ODS data
  {
    method: 'POST',
    url: `${URL_PREFIX_PRIVATE}/${PARAM_OBJECT_METADATA}/${PARAM_ACTION_INIT}`,
    preHandler: onDevRoute,
    handler: metadataController.initWithODR,
    config: { [ROUTE_NAME]: DEV_INIT_WITH_ODR },
  },

  // ------------------------------------------------------------------------------------------------
  // UUID v4 generation
  // ------------------------------------------------------------------------------------------------
  {
    method: 'GET',
    url: `${URL_PREFIX_PRIVATE}/${PARAM_ACTION_UUID_GEN}`,
    preHandler: onDevRoute,
    handler: genericController.generateUUID,
    config: { [ROUTE_NAME]: DEV_GENERATE_UUID },
  },
  // ------------------------------------------------------------------------------------------------
  // Portal token
  // ------------------------------------------------------------------------------------------------
  // Get a new token from the Portal
  {
    method: 'GET',
    url: `${URL_PV_PORTAL_PREFIX}/${URL_SUFFIX_TOKEN_GET}`,
    preHandler: onDevRoute,
    handler: portalController.exposedGetPortalToken,
    config: { [ROUTE_NAME]: DEV_EXPOSED_GET_PORTAL_TOKEN },
  },
  // Get a token checked by the Portal
  {
    method: 'GET',
    url: `${URL_PV_PORTAL_PREFIX}/${URL_SUFFIX_TOKEN_GET}/${URL_SUFFIX_TOKEN_CHECK}`,
    preHandler: onDevRoute,
    handler: portalController.checkStoredToken,
    config: { [ROUTE_NAME]: DEV_CHECK_STORED_TOKEN },
  },

  // ------------------------------------------------------------------------------------------------
  // Get/post resources from/to Portal
  // ------------------------------------------------------------------------------------------------
  {
    method: 'GET',
    url: `${URL_PV_PORTAL_PREFIX}/${PARAM_OBJECT_METADATA}/:${PARAM_ID}`,
    preHandler: onDevRoute,
    handler: portalController.getMetadata,
    config: { [ROUTE_NAME]: DEV_GET_PORTAL_METADATA },
  },
  {
    method: 'POST',
    url: `${URL_PV_PORTAL_PREFIX}/${PARAM_OBJECT_METADATA}/:${PARAM_ID}`,
    preHandler: onDevRoute,
    handler: portalController.sendMetadata,
    config: { [ROUTE_NAME]: DEV_SEND_METADATA_TO_PORTAL },
  },
  {
    method: 'DELETE',
    url: `${URL_PV_PORTAL_PREFIX}/${PARAM_OBJECT_METADATA}/:${PARAM_ID}`,
    preHandler: onDevRoute,
    handler: portalController.deleteMetadata,
    config: { [ROUTE_NAME]: DEV_DEL_PORTAL_METADATA },
  },

  // ------------------------------------------------------------------------------------------------
  // Accessing app info (git hash)
  // ------------------------------------------------------------------------------------------------
  /**
   * Get current git hash
   */
  {
    method: 'GET',
    url: `${URL_PV_GIT_HASH_ACCESS}`,
    preHandler: onFreeRoute,
    handler: sysController.getGitHash,
    config: { [ROUTE_NAME]: DEV_GET_GIT_HASH },
  },
  /**
   * Get current git hash from the running application
   */
  {
    method: 'GET',
    url: `${URL_PV_APP_HASH_ACCESS}`,
    preHandler: onFreeRoute,
    handler: sysController.getAppHash,
    config: { [ROUTE_NAME]: DEV_GET_APP_HASH },
  },
  /**
   * Get current API version
   */
  {
    method: 'GET',
    url: `${URL_PUB_API_VERSION}`,
    preHandler: onFreeRoute,
    handler: sysController.getApiVersion,
    config: { [ROUTE_NAME]: DEV_GET_API_VERSION },
  },
  /**
   * Get node and npm versions
   */
  {
    method: 'GET',
    url: `${URL_PV_NODE_VERSION_ACCESS}`,
    preHandler: onDevRoute,
    handler: sysController.getNodeVersion,
    config: { [ROUTE_NAME]: DEV_GET_NODE_VERSION },
  },

  /**
   * Get this module environment
   */
  {
    method: 'GET',
    url: `${URL_PV_APP_ENV_ACCESS}`,
    preHandler: onFreeRoute,
    handler: sysController.getEnvironment,
    config: { [ROUTE_NAME]: DEV_GET_APP_ENV },
  },

  // ------------------------------------------------------------------------------------------------
  // Accessing logs
  // ------------------------------------------------------------------------------------------------
  {
    method: 'GET',
    url: `${URL_PV_LOGS_ACCESS}`,
    preHandler: onDevRoute,
    handler: getLogs,
    config: { [ROUTE_NAME]: DEV_GET_LOGS },
  },
  {
    method: 'GET',
    url: `${URL_PV_LOGS_ACCESS}/:${PARAM_LOGS_LINES}`,
    preHandler: onDevRoute,
    handler: getLastLogLines,
    config: { [ROUTE_NAME]: DEV_GET_LAST_LOG_LINES },
  },

  // ------------------------------------------------------------------------------------------------
  // Actions on DB
  // ------------------------------------------------------------------------------------------------
  // Get all collections
  {
    method: 'GET',
    url: `${URL_PV_DB_ACCESS}`,
    preHandler: onDevRoute,
    handler: dbController.getCollections,
    config: { [ROUTE_NAME]: DEV_GET_COLLECTIONS },
  },
  // Drop DB
  {
    method: 'DELETE',
    url: `${URL_PV_DB_ACCESS}`,
    preHandler: onDevRoute,
    handler: dbController.dropDB,
    config: { [ROUTE_NAME]: DEV_DROP_DB },
  },
  // ------------------------------------------------------------------------------------------------
  // Tests entry
  // ------------------------------------------------------------------------------------------------
  /*  {
    method: 'GET',
    url: `${URL_PREFIX_PRIVATE}/test`,
    preHandler: onDevRoute,
    handler: devController.test,
    config: { [ROUTE_NAME]: DEV_TEST },
  }, */
]
