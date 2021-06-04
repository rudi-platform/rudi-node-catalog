// -----------------------------------------------------------------------------
// API version
// -----------------------------------------------------------------------------
exports.VERSION = '1.2.0'

// -----------------------------------------------------------------------------
// REQ methods
// -----------------------------------------------------------------------------
exports.HttpMethods = {
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
}

// -----------------------------------------------------------------------------
// REQ parameters
// -----------------------------------------------------------------------------
exports.DEFAULT_LANG = 'fr'

// --- "In path" parameters
exports.PARAM_LANG = 'lang'
exports.PARAM_OBJECT = 'object'
exports.PARAM_ID = 'id'
exports.PARAM_REPORT_ID = 'irid'

// --- "In query" parameters
exports.QUERY_LIMIT = 'limit'
exports.QUERY_OFFSET = 'offset'
exports.QUERY_FILTER = 'filter'
exports.QUERY_FIELDS = 'fields'
exports.QUERY_GROUP_BY = 'group_by'
exports.QUERY_COUNT_BY = 'count_by'

exports.QUERY_LIMIT_DEFAULT = 100
exports.QUERY_OFFSET_DEFAULT = 0

// -----------------------------------------------------------------------------
// REQ URL
// -----------------------------------------------------------------------------
exports.URL_PREFIX_PUBLIC = '/api/v1'

// This generic URL will be used to factorize the treatments on resources, organizations, contacts, etc.
exports.URL_OBJECT_GENERIC = `${this.URL_PREFIX_PUBLIC}/:${this.PARAM_OBJECT}`

exports.URL_OBJECT_METADATA = 'resources'
exports.URL_OBJECT_ORGANIZATIONS = 'organizations'
exports.URL_OBJECT_CONTACTS = 'contacts'
exports.URL_OBJECT_MEDIA = 'media'
exports.URL_OBJECT_SKOS_SCHEME = 'skos_schemes'
exports.URL_OBJECT_SKOS_CONCEPT = 'skos_concepts'

exports.URL_ACTION_UUID_GEN = 'id_generation'
exports.URL_ACTION_INIT = 'init'
exports.URL_ACTION_DELETION = 'deletion'
exports.URL_ACTION_FILTER = 'filter'
exports.URL_ACTION_REPORT = 'report'

exports.URL_OBJECTS = [
  this.URL_OBJECT_METADATA,
  this.URL_OBJECT_ORGANIZATIONS,
  this.URL_OBJECT_CONTACTS,
  this.URL_OBJECT_MEDIA,
  this.URL_OBJECT_SKOS_CONCEPT,
  this.URL_OBJECT_SKOS_SCHEME,
  this.URL_ACTION_REPORT,
]

// -----------------------------------------------------------------------------
// DB actions
// -----------------------------------------------------------------------------
exports.URL_PREFIX_PRIVATE = '/api/admin'

exports.URL_PORTAL_PREFIX = `${this.URL_PREFIX_PRIVATE}/portal`
exports.URL_TOKEN_GET = 'token'
exports.URL_TOKEN_CHECK = 'check'
exports.URL_TOKEN_ACCESS = `${this.URL_PORTAL_PREFIX}/${this.URL_TOKEN_GET}`
exports.URL_TOKEN_CHECK_ACCESS = `${this.URL_TOKEN_ACCESS}/${this.URL_TOKEN_CHECK}`

const URL_LOGS_SUFFIX = 'logs'
exports.URL_LOGS_ACCESS = `${this.URL_PREFIX_PRIVATE}/${URL_LOGS_SUFFIX}`
exports.PARAM_LOGS_LINES = `lines`

exports.URL_GIT_HASH_SUFFIX = 'hash'
exports.URL_GIT_HASH_ACCESS = `${this.URL_PREFIX_PRIVATE}/${this.URL_GIT_HASH_SUFFIX}`

exports.URL_APP_HASH_SUFFIX = 'apphash'
exports.URL_APP_HASH_ACCESS = `${this.URL_PREFIX_PRIVATE}/${this.URL_APP_HASH_SUFFIX}`

exports.URL_NODE_VERSION_SUFFIX = 'nv'
exports.URL_NODE_VERSION_ACCESS = `${this.URL_PREFIX_PRIVATE}/${this.URL_NODE_VERSION_SUFFIX}`

const URL_DB_SUFFIX = 'db'
exports.URL_DB_ACCESS = `${this.URL_PREFIX_PRIVATE}/${URL_DB_SUFFIX}`

const URL_THESAURUS_SUFFIX = 'enum'
exports.URL_THESAURUS_ACCESS = `${this.URL_PREFIX_PRIVATE}/${URL_THESAURUS_SUFFIX}`
exports.PARAM_THESAURUS_CODE = `code`

exports.URL_LICENCE_SUFFIX = 'licences'
exports.URL_LICENCE_ACCESS = `${this.URL_PREFIX_PRIVATE}/${this.URL_LICENCE_SUFFIX}`

const URL_LICENCE_CODES_SUFFIX = 'licence_codes'
exports.URL_LICENCE_CODES_ACCESS = `${this.URL_PREFIX_PRIVATE}/${URL_LICENCE_CODES_SUFFIX}`
