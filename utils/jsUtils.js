/* eslint-disable no-console */
'use strict'

const mod = 'utils'

// ------------------------------------------------------------------------------------------------
// External dependencies
// ------------------------------------------------------------------------------------------------
const { inspect } = require('util')
const { floor, pick } = require('lodash')
const datetime = require('date-and-time')

// ------------------------------------------------------------------------------------------------
// Internal dependencies
// ------------------------------------------------------------------------------------------------
const { TRACE } = require('../config/confApi')

// ------------------------------------------------------------------------------------------------
// String
// ------------------------------------------------------------------------------------------------
exports.padWithEqualSignBase4 = (str) => this.pad(str, 4, '=')
exports.toBase64 = (str) => this.convertEncoding(str, 'utf-8', 'base64')
exports.toBase64Url = (str) => this.convertEncoding(str, 'utf-8', 'base64url')
exports.toPaddedBase64Url = (str) => this.padWithEqualSignBase4(this.toBase64Url(str))
exports.decodeBase64 = (data) => this.convertEncoding(data, 'base64', 'utf-8')
exports.decodeBase64url = (data) => this.convertEncoding(data, 'base64url', 'utf-8')

exports.convertEncoding = (data, fromEncoding, toEncoding) => {
  const fun = 'convertEncoding'
  try {
    let dataStr = data
    if (typeof data === 'object') dataStr = JSON.stringify(data)
    return Buffer.from(dataStr, fromEncoding).toString(toEncoding)
  } catch (err) {
    this.consoleErr(mod, fun, err)
    throw err
  }
}

/**
 * Adds a sign at the end of a string so that the padded string has a length that is a multiple of a given base.
 * @param {String} str The input string
 * @param {Number} base The number the length of the padded string must be a multiple of
 * @param {String} padSign The character used for the padding
 * @returns
 */
exports.pad = (str, base, padSign) => {
  const fun = 'pad'
  // this.consoleLog(mod, fun, `base = ${base}, sign = '${padSign}'`)
  try {
    padSign = padSign?.substring(0, 1)
    const modulo = str.length % base

    // this.consoleLog(mod, fun, `str.length: ${str.length}`)
    // this.consoleLog(mod, fun, `modulo: ${modulo}`)
    if (modulo === 0) return str

    let padding = padSign
    for (let i = modulo; i > base; i++) {
      padding = `${padding}${padSign}`
    }
    // this.consoleLog(mod, fun, `padding: ${padding}`)
    return `${str}${padding}`
  } catch (err) {
    this.consoleErr(mod, fun, err)
    throw err
  }
}

exports.shorten = (str, len) => {
  if (!str) return
  if (str.length < len) return str
  return str.substring(0, len) + '[...]'
}

exports.padA1 = (num) => {
  var norm = Math.floor(Math.abs(num))
  return (norm < 10 ? '0' : '') + norm
}

// ------------------------------------------------------------------------------------------------
// Dates
// ------------------------------------------------------------------------------------------------
exports.nowISO = () => new Date().toISOString()

exports.toISOLocale = (date) => {
  if (!date) date = new Date()

  const isoTimezoneOffset = -date.getTimezoneOffset()
  const dif = isoTimezoneOffset >= 0 ? '+' : '-'

  return (
    date.getFullYear() +
    '-' +
    this.padA1(date.getMonth() + 1) +
    '-' +
    this.padA1(date.getDate()) +
    'T' +
    this.padA1(date.getHours()) +
    ':' +
    this.padA1(date.getMinutes()) +
    ':' +
    this.padA1(date.getSeconds()) +
    dif +
    this.padA1(isoTimezoneOffset / 60) +
    ':' +
    this.padA1(isoTimezoneOffset % 60)
  )
}

exports.nowEpochMs = () => new Date().getTime()

exports.nowEpochS = () => floor(this.nowEpochMs() / 1000)

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

exports.LOG_DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss SSS'

exports.nowLocaleFormatted = () => datetime.format(new Date(), this.LOG_DATE_FORMAT)
// const [date, month, year] = new Date().toLocaleDateString('fr-FR').split('/')
// const [h, m, s] = new Date().toLocaleTimeString('fr-FR').split(/:| /)
// return `${year}/${month}/${date} ${h}:${m}:${s}`

// ------------------------------------------------------------------------------------------------
// Strings
// ------------------------------------------------------------------------------------------------
exports.isString = (str) => typeof str === 'string'

// ------------------------------------------------------------------------------------------------
// Arrays
// ------------------------------------------------------------------------------------------------
exports.isArray = (anArray) => Array.isArray(anArray)
exports.isNotEmptyArray = (anArray) => Array.isArray(anArray) && anArray.length > 0
exports.isEmptyArray = (anArray) => Array.isArray(anArray) && anArray.length === 0
exports.getLast = (array) => (Array.isArray(array) ? array[array.length - 1] : null)
// ------------------------------------------------------------------------------------------------
// Objects
// ------------------------------------------------------------------------------------------------
exports.isObject = (obj) => Object.prototype.toString.call(obj) === '[object Object]'
//Object.keys(obj).length > 0
exports.isEmptyObject = (obj) =>
  !this.isString(obj) && !Array.isArray(obj) && Object.keys(obj).length === 0
exports.isNotEmptyObject = (obj) => obj && Object.keys(obj).length > 0

exports.NOT_FOUND = '!_not_found_!'
exports.quietAccess = (obj, prop) => {
  try {
    if (typeof obj[prop] === 'undefined') return this.NOT_FOUND
    return obj[prop]
  } catch {
    return this.NOT_FOUND
  }
}

/** !! TODO: treat object arrays! */
exports.getPaths = async (root, parentKeyName) => {
  // if obj has no keys, abort
  if (this.isString(root) || Array.isArray(root) || Object.keys(root).length === 0) {
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
  const reshapedList = objList.map((obj) => pick(obj, fieldList))
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

// ------------------------------------------------------------------------------------------------
// JSON
// ------------------------------------------------------------------------------------------------
exports.isEmpty = (prop) => {
  const strProp = JSON.stringify(prop)
  return prop == '' || prop == '{}' || prop == '[]' || strProp == '{}' || strProp == '[]'
}

/* 
  TRUE:
    !null
    !undefined
    !''

  FALSE:
    !{}
    ![]
*/
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
    return `${inspect(jsonObject)}`
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

// ------------------------------------------------------------------------------------------------
// Basic logging
// ------------------------------------------------------------------------------------------------

const BASE_LINE = `================================================================================`

exports.separateLogs = (insertStr, shouldDisplayDate) => {
  const dateStr = shouldDisplayDate ? `${this.nowLocaleFormatted()} ` : ''
  const inputStr = insertStr ? `[ ${insertStr} ]==` : ''
  const eatenCharacters = dateStr.length + inputStr.length

  const line = BASE_LINE.substring(eatenCharacters)

  const logSeparator = `${dateStr}${line}${inputStr}`

  console.log('\nD ' + logSeparator)
  return logSeparator
}

exports.logWhere = (srcMod, srcFun) => {
  return !srcMod ? srcFun : !srcFun ? srcMod : `${srcMod} . ${srcFun}`
}

exports.displayStr = (srcMod, srcFun, msg) => {
  return `[ ${this.logWhere(srcMod, srcFun)} ] ${msg !== '' ? msg : '<-'}`
}

exports.consoleLog = (srcMod, srcFun, msg) => {
  console.log('D', this.nowLocaleFormatted(), this.displayStr(srcMod, srcFun, msg))
}

exports.consoleErr = (srcMod, srcFun, msg) => {
  const errMsg = !msg ? undefined : msg[TRACE] || msg
  console.error('E', this.nowLocaleFormatted(), this.displayStr(srcMod, srcFun, errMsg))
}
