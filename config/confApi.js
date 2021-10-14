// ------------------------------------------------------------------------------------------------
// API version
// ------------------------------------------------------------------------------------------------
exports.VERSION = '1.2.3'

// ------------------------------------------------------------------------------------------------
// REQ methods
// ------------------------------------------------------------------------------------------------
exports.HttpMethods = {
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
}

// ------------------------------------------------------------------------------------------------
// REQ parameters
// ------------------------------------------------------------------------------------------------
exports.DEFAULT_LANG = 'fr'

// --- "In path" parameters
exports.PARAM_LANG = 'lang'
exports.PARAM_OBJECT = 'object'
exports.PARAM_ID = 'id'
exports.PARAM_REPORT_ID = 'irid'

// --- "Objects" parameters
exports.PARAM_OBJECT_METADATA = 'resources'
exports.PARAM_OBJECT_ORGANIZATIONS = 'organizations'
exports.PARAM_OBJECT_CONTACTS = 'contacts'
exports.PARAM_OBJECT_MEDIA = 'media'
exports.PARAM_OBJECT_SKOS_SCHEME = 'skos_schemes'
exports.PARAM_OBJECT_SKOS_CONCEPT = 'skos_concepts'
exports.PARAM_OBJECT_LOGS = 'logs'

exports.URL_OBJECTS = [
  this.PARAM_OBJECT_METADATA,
  this.PARAM_OBJECT_ORGANIZATIONS,
  this.PARAM_OBJECT_CONTACTS,
  this.PARAM_OBJECT_MEDIA,
  this.PARAM_OBJECT_SKOS_CONCEPT,
  this.PARAM_OBJECT_SKOS_SCHEME,
  this.PARAM_ACTION_REPORT,
  this.PARAM_OBJECT_LOGS,
]

// --- "In query" parameters
exports.QUERY_LIMIT = 'limit'
exports.QUERY_OFFSET = 'offset'
exports.QUERY_FILTER = 'filter'
exports.QUERY_FIELDS = 'fields'
exports.QUERY_SORT_BY = 'sort_by'
exports.QUERY_COUNT_BY = 'count_by'
exports.QUERY_GROUP_BY = 'group_by'
exports.QUERY_GROUP_LIMIT = 'group_limit'
exports.QUERY_GROUP_OFFSET = 'group_offset'
exports.QUERY_UPDATED_AFTER = 'updated_after'
exports.QUERY_UPDATED_BEFORE = 'updated_before'
exports.QUERY_CONFIRM = 'confirm'
exports.QUERY_CONFIRM = 'confirm'

exports.DEFAULT_QUERY_LIMIT = 100
exports.DEFAULT_QUERY_OFFSET = 0

exports.MAX_QUERY_LIMIT = 500

// ------------------------------------------------------------------------------------------------
// REQ URL
// ------------------------------------------------------------------------------------------------
exports.URL_PREFIX_PUBLIC = '/api/v1'

// This generic URL will be used to factorize the treatments on resources, organizations, contacts, etc.
exports.URL_PUB_METADATA = `${this.URL_PREFIX_PUBLIC}/${this.PARAM_OBJECT_METADATA}`

exports.PARAM_ACTION_UUID_GEN = 'id_generation'
exports.PARAM_ACTION_INIT = 'init'
exports.PARAM_ACTION_SIGN = 'sign'
exports.PARAM_ACTION_DELETION = 'deletion'
exports.PARAM_ACTION_UNLINKED = 'unlinked'
exports.PARAM_ACTION_REPORT = 'report'

// ------------------------------------------------------------------------------------------------
// DB actions
// ------------------------------------------------------------------------------------------------

exports.URL_PREFIX_PRIVATE = '/api/admin'

const URL_SUFFIX_PORTAL = 'portal'
const URL_SUFFIX_DB = 'db'
const URL_SUFFIX_THESAURUS = 'enum'
const URL_SUFFIX_LICENCE_CODES = 'licence_codes'

exports.URL_SUFFIX_TOKEN_GET = 'token'
exports.URL_SUFFIX_TOKEN_CHECK = 'check'
exports.URL_SUFFIX_GIT_HASH = 'hash'
exports.URL_SUFFIX_APP_HASH = 'apphash'
exports.URL_SUFFIX_APP_ENV = 'env'
exports.URL_SUFFIX_NODE_VERSION = 'nv'
exports.URL_SUFFIX_LICENCE = 'licences'

exports.PARAM_THESAURUS_CODE = `code`
exports.PARAM_THESAURUS_LANG = `lang`
exports.PARAM_LOGS_LINES = `lines`

exports.URL_PV_PORTAL_PREFIX = `${this.URL_PREFIX_PRIVATE}/${URL_SUFFIX_PORTAL}`
exports.URL_PV_TOKEN_ACCESS = `${this.URL_PV_PORTAL_PREFIX}/${this.URL_SUFFIX_TOKEN_GET}`
exports.URL_PV_TOKEN_CHECK_ACCESS = `${this.URL_PV_TOKEN_ACCESS}/${this.URL_SUFFIX_TOKEN_CHECK}`

exports.URL_PV_LOGS_ACCESS = `${this.URL_PREFIX_PRIVATE}/${this.PARAM_OBJECT_LOGS}`
exports.URL_PV_GIT_HASH_ACCESS = `${this.URL_PREFIX_PRIVATE}/${this.URL_SUFFIX_GIT_HASH}`
exports.URL_PV_APP_HASH_ACCESS = `${this.URL_PREFIX_PRIVATE}/${this.URL_SUFFIX_APP_HASH}`
exports.URL_PV_APP_ENV_ACCESS = `${this.URL_PREFIX_PRIVATE}/${this.URL_SUFFIX_APP_ENV}`
exports.URL_PV_NODE_VERSION_ACCESS = `${this.URL_PREFIX_PRIVATE}/${this.URL_SUFFIX_NODE_VERSION}`

exports.URL_PV_DB_ACCESS = `${this.URL_PREFIX_PRIVATE}/${URL_SUFFIX_DB}`
exports.URL_PV_OBJECT_GENERIC = `${this.URL_PREFIX_PRIVATE}/:${this.PARAM_OBJECT}`

exports.URL_PV_THESAURUS_ACCESS = `${this.URL_PREFIX_PRIVATE}/${URL_SUFFIX_THESAURUS}`
exports.URL_PV_LICENCE_ACCESS = `${this.URL_PREFIX_PRIVATE}/${this.URL_SUFFIX_LICENCE}`
exports.URL_PV_LICENCE_CODES_ACCESS = `${this.URL_PREFIX_PRIVATE}/${URL_SUFFIX_LICENCE_CODES}`
