const regexUUIDv4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const regexDOI = /^10.\d{4,9}\/[-.;()\/:\w]+$/i;
// \d : digit character == [0-9]
// \w : word character == [0-9a-zA-Z_]
// /i (at the end) : expression is case insensitive
// source: https://www.crossref.org/blog/dois-and-matching-regular-expressions/
// alternative: https://github.com/regexhq/doi-regex/blob/master/index.js

const regexURI = /^(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?$/;
const regexEmail = /^([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

function validateSchema(schemaStr, regExPattern) {
  const regExp = new RegExp(regExPattern)
  return schemaStr.match(regExp)
}

function isUUIDv4(str) {
  return validateSchema(str, regexUUIDv4)
}

function isDOI(str) {
  return validateSchema(str, regexDOI)
}

function isRudiID(str) {
  return isUUIDv4(str) // || isDOI(idStr)
}

function isURI(str) {
  return str.match(new RegExp(regexURI))
}

function isEmail(str) {
  return str.match(new RegExp(regexEmail))
}

function isVersion(str) {
  return str.match(new RegExp(
    /^([0-9]{1,2}\.){2}[0-9]{1,2}[a-z]*$/
  ))
}


module.exports = {
  validateSchema,
  isDOI,
  isUUIDv4,
  isURI,
  isEmail,
  isVersion
}