
const regexUUIDv4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const regexDOI = /^10.\d{4,9}\/[-.;()\/:\w]+$/i; 
// \d : digit character == [0-9]
// \w : word character == [0-9a-zA-Z_]
// /i (at the end) : expression is case insensitive
// source: https://www.crossref.org/blog/dois-and-matching-regular-expressions/
// alternative: https://github.com/regexhq/doi-regex/blob/master/index.js

module.exports.validateSchemaPattern = function (schemaStr, regExPattern) {
  const regExp = new RegExp(regExPattern)
  return schema.match(regExp)
}

module.exports.isUUIDv4 = function (idStr) {
  return validateSchema(idStr, regexUUIDv4) 
}

module.exports.isDOI = function (idStr) {
  return validateSchema(idStr, regexDOI) 
} 

module.exports.isRudiID = function (idStr) {
  return isUUIDv4(idStr) || isDOI(idStr)
}
