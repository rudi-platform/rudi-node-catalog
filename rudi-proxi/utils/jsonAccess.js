//———————————————————————————————————————————————————————————————
// External dependancies 
//———————————————————————————————————————————————————————————————
const boom = require('@hapi/boom')
const log = require('../utils/logging')
const msg = require('./msg')

//———————————————————————————————————————————————————————————————
// Functions
//———————————————————————————————————————————————————————————————

exports.accessParam = (jsonObject, jsonProperty) => {
  const fun = 'accessParam'

  const value = jsonObject[jsonProperty]
  if (!value || '' == value) {
    throw new Error(`${msg.parameterExpected(jsonObject, jsonProperty)}`)
  }
  return value
}

exports.accessProperty = (jsonObject, jsonProperty) => {
  const fun = 'accessProperty'

  const value = jsonObject[jsonProperty]
  if (!value || '' == value) {
    throw new Error(`${msg.missingProperty(jsonObject, jsonProperty)}`)
  }
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