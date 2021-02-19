//———————————————————————————————————————————————————————————————
// REQ parameters
//———————————————————————————————————————————————————————————————
const REQ_LANG = 'lang';
const REQ_ID = 'id';

//———————————————————————————————————————————————————————————————
// REQ URL
//———————————————————————————————————————————————————————————————
const URL_PREFIX = '/api/v1/';
const URL_METADATA = `${URL_PREFIX}:${REQ_LANG}/resources`
const URL_ORGANIZATIONS = `${URL_PREFIX}organizations`
const URL_CONTACTS = `${URL_PREFIX}contacts`

module.exports = {
  REQ_LANG,
  REQ_ID,
  URL_PREFIX,
  URL_METADATA,
  URL_ORGANIZATIONS,
  URL_CONTACTS
}