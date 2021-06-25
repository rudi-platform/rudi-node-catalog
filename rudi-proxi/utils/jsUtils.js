/* eslint-disable no-console */
'use strict'

const mod = 'utils'

// -----------------------------------------------------------------------------
// External dependancies
// -----------------------------------------------------------------------------
const util = require('util')
const _ = require('lodash')

// -----------------------------------------------------------------------------
// String
// -----------------------------------------------------------------------------
exports.toBase64 = (str) => {
  return Buffer.from(str, 'utf-8').toString('base64url')
}

exports.decodeBase64 = (data) => {
  return Buffer.from(data, 'base64url').toString('utf-8')
}

// -----------------------------------------------------------------------------
// Dates
// -----------------------------------------------------------------------------
exports.nowISO = () => {
  return new Date().toISOString()
}

exports.nowEpochMs = () => {
  return new Date().getTime()
}
exports.nowEpochS = () => {
  return _.floor(this.nowEpochMs() / 1000)
}
exports.dateEpochSToIso = (utcSeconds) => {
  const fun = 'dateEpochSToIso'
  try {
    return this.dateEpochMsToIso(utcSeconds * 1000)
  } catch (err) {
    this.consoleErr(mod, fun, `input: ${utcSeconds} -> err: ${err}`)
  }
}
exports.dateEpochMsToIso = (utcMs) => {
  const fun = 'dateEpochMsToIso'
  try {
    return new Date(utcMs).toISOString()
  } catch (err) {
    this.consoleErr(mod, fun, `input: ${utcMs} -> err: ${err}`)
  }
}

exports.nowLocaleFormatted = () => {
  const [date, month, year] = new Date().toLocaleDateString('fr-FR').split('/')
  const [h, m, s] = new Date().toLocaleTimeString('fr-FR').split(/:| /)
  return `${year}/${month}/${date} ${h}:${m}:${s}`
}

// -----------------------------------------------------------------------------
// Arrays
// -----------------------------------------------------------------------------
exports.isString = (str) => {
  return typeof str === 'string'
}

// -----------------------------------------------------------------------------
// Arrays
// -----------------------------------------------------------------------------
exports.isArray = (anArray) => {
  return Array.isArray(anArray)
}

exports.isNotEmptyArray = (anArray) => {
  return Array.isArray(anArray) && anArray.length > 0
}

exports.isEmptyArray = (anArray) => {
  return Array.isArray(anArray) && anArray.length === 0
}

// -----------------------------------------------------------------------------
// Objects
// -----------------------------------------------------------------------------
exports.isEmptyObject = (obj) => {
  return !this.isString(obj) || !this.isArray(obj) || Object.keys(obj).length === 0
}

exports.isNotEmptyObject = (obj) => {
  return obj && Object.keys(obj).length > 0
}

exports.quietAccess = (obj, prop) => {
  try {
    return obj[prop]
  } catch {
    return {}
  }
}

/** !! TODO: treat object arrays! */
exports.getPaths = async (root, parentKeyName) => {
  // if obj has no keys, abort
  if (this.isString(root) || this.isArray(root) || Object.keys(root).length === 0) {
    return []
  }
  const keys = Object.keys(root)
  let rootSubPaths = []

  // console.log(this.beautify(root))

  await Promise.all(
    keys.map(async (key) => {
      const subObj = root[key]
      if (!subObj) return
      const keyPath = parentKeyName ? `${parentKeyName}.${key}` : `${key}`
      // console.log(`keyPath: ${keyPath}`)
      rootSubPaths.push(keyPath)
      if (this.isNotEmptyObject(subObj)) {
        const keyPaths = await this.getPaths(subObj, keyPath)
        rootSubPaths = rootSubPaths.concat(keyPaths)
        return true
      } else return false
    })
  )
  // console.log(this.beautify(rootSubPaths))
  return rootSubPaths
}

exports.listPick = (objList, fieldList) => {
  const reshapedList = objList.map((obj) => _.pick(obj, fieldList))
  return reshapedList
}

exports.filterOnValue = async (obj, predicate) => {
  const result = {}

  await Promise.all(
    Object.keys(obj).map((key) => {
      if (predicate(obj[key])) {
        result[key] = obj[key]
      }
      return result[key]
    })
  )

  return result
}

// -----------------------------------------------------------------------------
// JSON
// -----------------------------------------------------------------------------
exports.isEmpty = (prop) => {
  const strProp = JSON.stringify(prop)
  return prop === '' || prop === '{}' || prop === '[]' || strProp === '{}' || strProp === '[]'
}

exports.isNothing = (prop) => {
  return !prop || this.isEmpty(prop)
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
    return `${JSON.stringify(jsonObject, null, option).replace(/\\"/g, '"')}${
      option != null ? '\n' : ''
    }`
  } catch (err) {
    return `${util.inspect(jsonObject)}`
  }
}

/**
 * Clone a (JSON) object through JSON.stringify then JSON.parse (beware, it can be slow)
 * @param {JSON} jsonObject
 * @returns {JSON} The deep (dissociated) clone of the input object
 * @throws parameter 'jsonObject' is undefined, null or empty
 */
exports.deepClone = (jsonObject) => {
  return JSON.parse(JSON.stringify(jsonObject))
}

// -----------------------------------------------------------------------------
// Basic logging
// -----------------------------------------------------------------------------
exports.separateLogs = (insertStr) => {
  console.log(
    this.nowLocaleFormatted(),
    !insertStr
      ? `--------------------------------------------------------------------------`
      : `---------------------------------------------------------------[${insertStr}]--`
  )
}

exports.consoleLog = (mod, fun, msg) => {
  const where = !mod ? fun : !fun ? mod : `${mod} • ${fun}`
  const what = !msg || msg === '' ? '<-' : msg
  console.log(this.nowLocaleFormatted(), 'debug', `[${where}]`, what)
}

exports.consoleErr = (mod, fun, msg) => {
  const where = !mod ? fun : !fun ? mod : `${mod} • ${fun}`
  console.error(this.nowLocaleFormatted(), 'error', `[${where}]`, msg.err)
}

// -----------------------------------------------------------------------------
// Crypto
// -----------------------------------------------------------------------------
