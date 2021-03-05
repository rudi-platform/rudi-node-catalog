//———————————————————————————————————————————————————————————————
// API version
//———————————————————————————————————————————————————————————————
const API_VERSION = '1.1.0';

//———————————————————————————————————————————————————————————————
// REQ methods
//———————————————————————————————————————————————————————————————
const HttpMethods = {
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE'
}

//———————————————————————————————————————————————————————————————
// REQ parameters
//———————————————————————————————————————————————————————————————
const DEFAULT_LANG = 'fr'

//--- "In path" parameters
const PARAM_LANG = 'lang';
const PARAM_OBJECT = 'object';
const PARAM_ID = 'id';
const PARAM_REPORT_ID = 'irid';

//--- "In query" parameters
const QUERY_LIMIT = 'limit'
const QUERY_OFFSET = 'offset'

//———————————————————————————————————————————————————————————————
// REQ URL
//———————————————————————————————————————————————————————————————
const URL_PREFIX = '/api/v1/';

// This generic URL will be used to factorize the treatments on resources, organizations and contacts!
const URL_OBJECT = `${URL_PREFIX}:${PARAM_OBJECT}`

const URL_OBJECT_METADATA = 'resources'
const URL_OBJECT_ORGANIZATIONS = 'organizations'
const URL_OBJECT_CONTACTS = 'contacts'

const URL_ACTION_DELETION = 'deletion'
const URL_ACTION_REPORT = 'report'

/*
const URL_METADATA = `${URL_PREFIX}${URL_SUFIX_METADATA}`
const URL_ORGANIZATIONS = `${URL_PREFIX}${URL_SUFIX_ORGANIZATIONS}`
const URL_CONTACTS = `${URL_PREFIX}${URL_SUFIX_CONTACTS}`
 */


//———————————————————————————————————————————————————————————————
// Exports
//———————————————————————————————————————————————————————————————
module.exports = {
  HttpMethods,

  API_VERSION,

  URL_PREFIX,

  URL_OBJECT,
  URL_OBJECT_METADATA,
  URL_OBJECT_ORGANIZATIONS,
  URL_OBJECT_CONTACTS,

  URL_ACTION_DELETION,
  URL_ACTION_REPORT,

  DEFAULT_LANG,
  PARAM_LANG,
  PARAM_ID,
  PARAM_OBJECT,
  PARAM_REPORT_ID,

  QUERY_LIMIT,
  QUERY_OFFSET
}