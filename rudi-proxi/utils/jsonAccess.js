'use strict';
const mod = 'json'
//———————————————————————————————————————————————————————————————
// External dependancies 
//———————————————————————————————————————————————————————————————
const boom = require('@hapi/boom')
const util = require('util')
//———————————————————————————————————————————————————————————————
// Internal dependancies 
//———————————————————————————————————————————————————————————————
const log = require('./logging')
const msg = require('./msg')

//———————————————————————————————————————————————————————————————
// Functions
//———————————————————————————————————————————————————————————————

/**
 * Safe access to a property of a JSON object: ensures the property is defined
 * @param {JSON} req: the HTTP request
 * @param {String} param: a parameter in the HTTP request that should be defined
 * @returns {String} The value for the parameter
 * @throws request parameter is missing
 */
exports.accessReqParam = (req, param) => {
  const fun = 'accessReqParam'

  const value = req.params[param]
  if (!value) throw new Error(`${msg.missingRequestParameter(req, param)}`)

  return value
}

/**
 * Safe access to a property of a JSON object: ensures the property is defined
 * @param {JSON} jsonObject 
 * @param {String} jsonProperty 
 * @returns {String} The property value
 * @throws object property is missing
 */
exports.accessProperty = (jsonObject, jsonProperty) => {
  const fun = 'accessProperty'
  // log.d(mod, fun, `Accessing property '${jsonProperty}' from object '${json.beautify(jsonObject)}'`)
  const value = jsonObject[jsonProperty]
  // log.d(mod, fun, `=> value = ${json.beautify(value)}`)
  if (!value) throw new Error(`${msg.missingObjectProperty(jsonObject, jsonProperty)}`)
  // log.d(mod, fun, `=> ${jsonProperty} = ${json.beautify(value)}`)
  return value
}

/**
 * Clone a (JSON) object through JSON.stringify then JSON.parse (beware, it can be slow)
 * @param {JSON} jsonObject 
 * @returns {JSON} The deep (dissociated) clone of the input object
 * @throws parameter 'jsonObject' is undefined, null or empty
 */
exports.deepClone = (jsonObject) => {
  const fun = 'deepClone'
  log.d(mod, fun, ``)
  try {
    if (!jsonObject) throw new Error(`${msg.parameterExpected(fun, 'jsonObject')}`)
    return JSON.parse(JSON.stringify(jsonObject));
  } catch (err) {
    log.e(mod, fun, err)
    throw boom.boomify(err)
  }
}


/**
 * Custom JSON beautifying function
 * @param {JSON} jsonObject: a JSON object
 * @param {String or number} options: JSON.stringify options. 4 or '\t' make it possible
 *                                    to display the JSON on several lines
 * @returns {String} JSON.stringify options
 */
exports.beautify = (jsonObject, option) => {
  try{
  return `${JSON.stringify(jsonObject, null, option)}${option!=null?'\n':''}`
  } catch (err) {
    return `${util.inspect(jsonObject)}`

  }
}
