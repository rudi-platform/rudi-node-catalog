//———————————————————————————————————————————————————————————————
// REQ parameters
//———————————————————————————————————————————————————————————————
const REQ_LANG = 'lang';
const REQ_ID = 'id';

//———————————————————————————————————————————————————————————————
// REQ URL
//———————————————————————————————————————————————————————————————
const DB_NAME = "rudi_prod"
const DB_PORT = 27017
const DB_URL = `mongodb://127.0.0.1/${DB_NAME}`

const URL_PREFIX = '/api/v1/';
const URL_METADATA = `${URL_PREFIX}:${REQ_LANG}/resources`
const URL_ORGANIZATIONS = `${URL_PREFIX}organizations`
const URL_CONTACTS = `${URL_PREFIX}contacts`


module.exports = {
  DB_NAME,
  DB_PORT,
  DB_URL,
  URL_PREFIX,
  REQ_LANG,
  REQ_ID,
  URL_METADATA,
  URL_ORGANIZATIONS,
  URL_CONTACTS
}