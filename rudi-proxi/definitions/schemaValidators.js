'use strict';


// \d : digit character == [0-9]
// \w : word character == [0-9a-zA-Z_]
// /i (at the end) : expression is case insensitive


//———————————————————————————————————————————————————————————————
// Generic functions
//———————————————————————————————————————————————————————————————
exports.validateSchema = (schemaStr, regExPattern) => {
  return schemaStr.match(new RegExp(regExPattern))
}

//———————————————————————————————————————————————————————————————
// UUID
//———————————————————————————————————————————————————————————————

const regexUUIDv4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

exports.isUUIDv4 = (str) => {
  return this.validateSchema(str, regexUUIDv4)
}

exports.isRudiID = (str) => {
  return this.isUUIDv4(str) // || isDOI(idStr)
}

//———————————————————————————————————————————————————————————————
// DOI
//———————————————————————————————————————————————————————————————

// source: https://www.crossref.org/blog/dois-and-matching-regular-expressions/
// alternative: https://github.com/regexhq/doi-regex/blob/master/index.js
const regexDOI = /^10.\d{4,9}\/[-.;()\/:\w]+$/i;
exports.isDOI = (str) => {
  return this.validateSchema(str, regexDOI)
}

//———————————————————————————————————————————————————————————————
// URI
//———————————————————————————————————————————————————————————————

const regexURI = /^(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?$/;
exports.isURI = (str) => {
  return this.validateSchema(str, regexURI)
}

//———————————————————————————————————————————————————————————————
// E-mail
//———————————————————————————————————————————————————————————————

const regexEmail = /^([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
exports.isEmail = (str) => {
  return this.validateSchema(str, regexEmail)
}

//———————————————————————————————————————————————————————————————
// API version
//———————————————————————————————————————————————————————————————
const regexVersionRudi = /^[0-9]{1,2}\.[0-9]{1,2}(\.[0-9]{1,2})?[a-z]*$/
exports.isVersion = (str) => {
  return this.validateSchema(str, regexVersionRudi)
}

