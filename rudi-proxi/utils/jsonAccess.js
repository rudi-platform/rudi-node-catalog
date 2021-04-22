'use strict';
const mod = 'json'
//---------------------------------------------------------------
// External dependancies 
//---------------------------------------------------------------
const boom = require('@hapi/boom')
const util = require('util')
const _ = require('lodash')
//---------------------------------------------------------------
// Internal dependancies 
//---------------------------------------------------------------
const log = require('./logging')
const msg = require('./msg')

//---------------------------------------------------------------
// Functions
//---------------------------------------------------------------
exports.isEmpty = (prop) => {
  const fun = 'isEmpty'
  const strProp = JSON.stringify(prop)
  // log.d(mod, fun, `prop: ${str}`)
  return prop == '' || prop == '{}' || prop == '[]' || strProp == '{}' || strProp == '[]'
}

exports.isNothing = (prop) => {
  const fun = 'isNothing'
  const result = (!prop || this.isEmpty(prop))
  /* 
    log.d(mod, fun, `===`)
    log.d(mod, fun, `prop: ${prop}`)
    log.d(mod, fun, `!prop: ${!prop}`)
    log.d(mod, fun, `!!!prop: ${!!!prop}`)
    log.d(mod, fun, `prop == null: ${prop == null}`)
    log.d(mod, fun, `prop == undefined: ${prop == undefined}`)
    log.d(mod, fun, `prop == {}: ${prop == {}}`)
    log.d(mod, fun, `prop == '{}': ${prop == '{}'}`)
    log.d(mod, fun, `prop == []: ${prop == []}`)
    log.d(mod, fun, `_.isEmpty(prop): ${_.isEmpty(prop)}`)
    log.d(mod, fun, `this.isEmpty(prop): ${this.isEmpty(prop)}`)
    log.d(mod, fun, `isNothing prop: ${result}`)
   */
  return result
}

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
 * Ensures the sub-property is defined when the parent property is defined
 * If parameter 'enumVal' is set, checks that subProperty is defined if enum property is set to enumVal
 * @param {JSON} jsonObject
 * @param {String} jsonProperty 
 * @param {String} jsonProperty 
 * @param {String} jsonProperty supporting the enum value
 * @param {String} enum value
 * @returns {String} The property value
 * @throws object property is missing
 */
exports.requireSubProperty = (obj, prop, subProp, enumProp, enumVal) => {
  const fun = 'requireSubProperty'
  // log.d(mod, fun, `prop: ${prop} | subProp: ${subProp} | enumVal: ${enumVal}`)
  if (this.isNothing(obj[prop])) {
    log.d(mod, fun, `empty obj[${prop}]: ${this.beautify(obj[prop])}`)
    return
  }
  const objProp = obj[prop]

  // log.d(mod, fun, `${prop}: ${this.beautify(propObj)}`)
  // log.d(mod, fun, `${prop}.${subProp}: ${this.beautify(propObj[subProp])}`)
  if (!enumVal) { // Regular check: if prop is defined, subProp must be defined !
    // log.d(mod, fun, `obj.${prop} / ${enumVal}`)
    if (this.isNothing(objProp[subProp])) {
      const errMsg = msg.subPropNeededWhenPropSet(prop, subProp)
      // log.e(mod, fun, errMsg)
      throw new Error(errMsg)
    }
    // log.d(mod, fun, `${objProp[subProp]}`)
    return objProp[subProp]
  } else { // Enum conditional check: if prop is defined and enumProp is set to enumVal, subProp must be defined !
    if (objProp[enumProp] == enumVal) {
      // log.d(mod, fun, `obj.${prop}.${enumProp} == ${enumVal}`)
      if (this.isNothing(objProp[subProp])) {
        const errMsg = msg.subPropNeededWhenPropSetToEnum(prop, subProp, enumProp, enumVal)
        // log.e(mod, fun, errMsg)
        throw new Error(errMsg)
      } else {
        return objProp[subProp]
      }
    } else {
      log.d(mod, fun, `obj.${prop}.${enumProp} == ${this.beautify(objProp[enumProp])} != ${enumVal}`)
      return
    }
  }
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
    if (!jsonObject) {
      log.e(mod, fun, `Input parameter should not be null nor undefined: ${this.beautify(jsonObject)}`)
      throw new Error(`${msg.parameterExpected(fun, 'jsonObject')}`)
    }
    return JSON.parse(JSON.stringify(jsonObject));
  } catch (err) {
    log.e(mod, fun, err)
    throw err
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
  try {
    return `${JSON.stringify(jsonObject, null, option)}${option!=null?'\n':''}`
  } catch (err) {
    return `${util.inspect(jsonObject)}`

  }
}