//———————————————————————————————————————————————————————————————
// External dependancies 
//———————————————————————————————————————————————————————————————
const boom = require('@hapi/boom')
const log = require('../utils/logging')
const msg = require('./msg')

//———————————————————————————————————————————————————————————————
// Functions
//———————————————————————————————————————————————————————————————

exports.accessReqParam = (req, param) => {
  const fun = 'accessReqParam'

  const value = req.params[param]
  if (!value) throw new Error(`${msg.requestParameterExpected(req, param)}`)

  return value
}

exports.accessParam = (jsonObject, jsonProperty) => {
  const fun = 'accessParam'

  const value = jsonObject[jsonProperty]
  if (!value) throw new Error(`${msg.parameterExpected(jsonObject, jsonProperty)}`)

  return value
}

exports.accessProperty = (jsonObject, jsonProperty) => {
  const fun = 'accessProperty'
  log.d(fun, `Accessing property '${jsonProperty}' from object '${JSON.stringify(jsonObject)}'`)

  const value = jsonObject[jsonProperty]
  // log.d(fun, `=> value = ${JSON.stringify(value)}`)

  if (!value) throw new Error(`${msg.missingProperty(jsonObject, jsonProperty)}`)

  // log.d(fun, `=> ${jsonProperty} = ${JSON.stringify(value)}`)
  return value
}

exports.removeProperty = (jsonObject, jsonProperty) => {
  const fun = 'removeProperty'
  log.d(fun, `${jsonProperty} = ${jsonObject[jsonProperty]}`)

  /* beautify ignore:start */
  const jsonClone = {...jsonObject}
  /* beautify ignore:end */

  this.accessProperty(jsonObject, jsonProperty)

  delete jsonObject[jsonProperty];
  log.d(fun, `jsonObject: ${jsonObject}`)

  delete jsonObject._id
  log.d(fun, `jsonObject: ${jsonObject}`)

  return jsonObject
}