//———————————————————————————————————————————————————————————————
// API version
//———————————————————————————————————————————————————————————————
exports.API_VERSION = '1.1.0';

//———————————————————————————————————————————————————————————————
// REQ methods
//———————————————————————————————————————————————————————————————
exports.HttpMethods = {
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE'
}

//———————————————————————————————————————————————————————————————
// REQ parameters
//———————————————————————————————————————————————————————————————
exports.DEFAULT_LANG = 'fr'

//--- "In path" parameters
exports.PARAM_LANG = 'lang';
exports.PARAM_OBJECT = 'object';
exports.PARAM_ID = 'id';
exports.PARAM_REPORT_ID = 'irid';

//--- "In query" parameters
exports.QUERY_LIMIT = 'limit'
exports.QUERY_OFFSET = 'offset'

//———————————————————————————————————————————————————————————————
// REQ URL
//———————————————————————————————————————————————————————————————
exports.URL_PREFIX_PUBLIC = '/api/v1';

// This generic URL will be used to factorize the treatments on resources, organizations and contacts!
exports.URL_OBJECT = `${this.URL_PREFIX_PUBLIC}/:${this.PARAM_OBJECT}`

exports.URL_OBJECT_METADATA = 'resources'
exports.URL_OBJECT_ORGANIZATIONS = 'organizations'
exports.URL_OBJECT_CONTACTS = 'contacts'

exports.URL_ACTION_DELETION = 'deletion'
exports.URL_ACTION_REPORT = 'report'


//———————————————————————————————————————————————————————————————
// DB actions
//———————————————————————————————————————————————————————————————
exports.URL_PREFIX_PRIVATE = '/api/admin';

exports.URL_LOGS_SUFFIX = 'logs'
exports.URL_LOGS_ACCESS = `${this.URL_PREFIX_PRIVATE}/${this.URL_LOGS_SUFFIX}`

exports.URL_APP_ID_SUFFIX = 'hash'
exports.URL_APP_ID_ACCESS = `${this.URL_PREFIX_PRIVATE}/${this.URL_APP_ID_SUFFIX}`

exports.URL_NODE_VERSION_SUFFIX = 'nv'
exports.URL_NODE_VERSION_ACCESS = `${this.URL_PREFIX_PRIVATE}/${this.URL_NODE_VERSION_SUFFIX}`

exports.URL_DB_SUFFIX = 'db'
exports.URL_DB_ACCESS = `${this.URL_PREFIX_PRIVATE}/${this.URL_DB_SUFFIX}`