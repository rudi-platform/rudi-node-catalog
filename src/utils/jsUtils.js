/* eslint-disable no-console */

const mod = 'utils'

// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import objectPath from 'object-path'
import { inspect } from 'util'

import _ from 'lodash'
const { pick } = _

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import minimist from 'minimist'
import { TRACE } from '../config/constApi.js'

// -------------------------------------------------------------------------------------------------
// Basic logging
// -------------------------------------------------------------------------------------------------

export const LOG_DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss SSS'
export const nowLocaleFormatted = () =>
  new Date().toISOString().replace(/T\./, ' ').replace('Z', '')
// datetime.format(new Date(), LOG_DATE_FORMAT)

const logLineSize = 110
export const SEP_LINE = ''.padEnd(logLineSize + 2, '-')
const BASE_LINE = ''.padEnd(logLineSize, '=')
export const separateLogs = (insertStr, shouldDisplayDate) => {
  const dateStr = shouldDisplayDate ? `${nowLocaleFormatted()} ` : ''
  const inputStr = insertStr ? `[ ${insertStr} ]==` : ''
  const eatenCharacters = dateStr.length + inputStr.length
  // const line = inputStr.padStart(BASE_LINE.length - eatenCharacters, '=')
  const line = BASE_LINE.slice(eatenCharacters)

  const logSeparator = `${dateStr}${line}${inputStr}`

  console.log('D ' + logSeparator)
  return logSeparator
}
console.log()
separateLogs('Booting', true)

// -------------------------------------------------------------------------------------------------
// Integer
// -------------------------------------------------------------------------------------------------
export const isInt = (n) => Number.isInteger(n)
export const isPositiveInt = (n) => isInt(n) && n >= 0

// Clean parseInt implementation
// https://stackoverflow.com/a/52720865/1563072
export const parseIntClean = (x) => {
  x = Number(x)
  return x >= 0 ? Math.floor(x) : Math.ceil(x)
}

// -------------------------------------------------------------------------------------------------
// String
// -------------------------------------------------------------------------------------------------

/**
 * Joins several string chunks with the first argument the function is called with.
 * This is basically the reverse of the String split function, with the difference that we make sure
 * the merging character is not duplicated
 * @param {string} sep separator we want to merge the string chunks with
 * @param {...string} args string chunks to be joined
 * @return {string}
 */
const mergeStrings = (sep, ...args) => {
  const argNb = args.length
  if (argNb == 0 || args[0] === undefined || args[0] === null) return ''
  let accumulatedStr = `${args[0]}`
  for (let i = 1; i < argNb; i++) {
    if (args[i] === undefined || args[i] === null) break
    const newChunk = `${args[i]}`
    const cleanChunk = newChunk.startsWith(sep) ? newChunk.slice(1) : newChunk
    accumulatedStr = accumulatedStr.endsWith(sep)
      ? accumulatedStr + cleanChunk
      : accumulatedStr + sep + cleanChunk
  }
  return accumulatedStr
}
export const pathJoin = (...args) => mergeStrings('/', ...args)

export const removeTrailingChar = (str, char = '/') =>
  str.endsWith(char) ? str.slice(0, str.length - char.length) : str
export const removeTrailingSlash = (str) => removeTrailingChar(str, '/')

export const isString = (str) => typeof str === 'string'

export const padWithEqualSignBase4 = (str) => padEndModulo(str, 4, '=')
export const toBase64 = (str) => convertEncoding(str, 'utf-8', 'base64')
export const toBase64url = (str) => convertEncoding(str, 'utf-8', 'base64url')
export const toPaddedBase64url = (str) => padWithEqualSignBase4(toBase64url(str))
export const decodeBase64 = (data) => convertEncoding(data, 'base64', 'utf-8')
export const decodeBase64url = (data) => convertEncoding(data, 'base64url', 'utf-8')

export const convertEncoding = (data, fromEncoding, toEncoding) =>
  Buffer.from(typeof data === 'object' ? JSON.stringify(data) : data, fromEncoding).toString(
    toEncoding
  )
export const joinBuffers = (buffers, delimiter = ':') =>
  buffers.reduce((prev, b) => Buffer.concat([prev, Buffer.from(delimiter, 'utf-8'), b]))

export const capitalizeFirstLetter = (str = '') => str.charAt(0).toUpperCase() + str.slice(1)

export const capitalize = (str = '') => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()

export const strToList = (str = '') => str.split(',').map((item) => item.trim())

export const createBasicAuth = (usr, pwd, usrEncoding = 'utf-8', pwdEncoding = 'base64') =>
  padWithEqualSignBase4(
    Buffer.concat([
      Buffer.from(usr, usrEncoding),
      Buffer.from(':', 'utf-8'),
      Buffer.from(pwd, pwdEncoding),
    ]).toString('base64')
  )

/**
 * Adds a sign at the end of a string so that the padded string has a length that is a multiple of a given base.
 * @param {String} str The input string
 * @param {Number} base The number the length of the padded string must be a multiple of
 * @param {String} padSign The character used for the padding
 * @returns
 */
export const padEndModulo = (str, base, padSign) => {
  const fun = 'pad'
  // consoleLog(mod, fun, `base = ${base}, sign = '${padSign}'`)
  try {
    padSign = padSign?.slice(0, 1)
    const modulo = str.length % base
    return modulo === 0 ? str : str.padEnd(str.length + base - modulo, padSign)
  } catch (err) {
    consoleErr(mod, fun, err)
    throw err
  }
}

export const shorten = (str, len) => {
  if (!str) return
  if (str.length < len) return str
  return str.slice(0, len) + '[...]'
}

export const padA1 = (num) => {
  const norm = Math.floor(Math.abs(num))
  return (norm < 10 ? '0' : '') + norm
}

export const padZerosLeft = (number, nbZeros = 2) => `${number}`.padStart(nbZeros, '0')

/**
 * Split an input string with an array of single characters
 * @param {string} inputStr the input string
 * @param {string[]} splitterArray an array of single characters
 * @param {boolean} shouldTrim true if each chunk should be trimmed
 * @returns the splitted string
 */
export const multiSplit = (inputStr, splitterArray, shouldTrim = true) => {
  const splitters = splitterArray.map((d) => d[0]).join('')
  const rgxStr = shouldTrim ? `(?:\\s*[${splitters}]\\s*)+` : `[${splitters}]+`
  return `${inputStr}`.split(RegExp(rgxStr))
}
// -------------------------------------------------------------------------------------------------
// Dates
// -------------------------------------------------------------------------------------------------

export const toISOLocale = (date) => {
  if (!date) date = new Date()

  const isoTimezoneOffset = -date.getTimezoneOffset()
  const dif = isoTimezoneOffset >= 0 ? '+' : '-'

  return (
    date.getFullYear() +
    '-' +
    padA1(date.getMonth() + 1) +
    '-' +
    padA1(date.getDate()) +
    'T' +
    padA1(date.getHours()) +
    ':' +
    padA1(date.getMinutes()) +
    ':' +
    padA1(date.getSeconds()) +
    dif +
    padA1(isoTimezoneOffset / 60) +
    ':' +
    padA1(isoTimezoneOffset % 60)
  )
}

export const timeEpochMs = (delayMs = 0) => new Date().getTime() + delayMs
export const timeEpochS = (delayS = 0) => Math.floor(new Date().getTime() / 1000) + delayS

export const dateToIso = (date) => {
  const fun = 'dateToIso'
  try {
    return (date ? new Date(date) : new Date()).toISOString()
  } catch (err) {
    consoleErr(mod, fun, `input: ${date} -> err: ${err}`)
    throw new Error(`input: ${date} -> err: ${err}`)
  }
}
export const nowISO = () => dateToIso()
export const nowFileDate = () =>
  new Date()
    .toISOString()
    .replace('T', '_')
    .replace(/([:]|\..*)/g, '')

export const dateEpochSToIso = (utcSeconds) => {
  const fun = 'dateEpochSToIso'
  try {
    return utcSeconds ? dateEpochMsToIso(utcSeconds * 1000) : nowISO()
  } catch (err) {
    consoleErr(mod, fun, `input: ${utcSeconds} -> err: ${err}`)
    throw new Error(`input: ${utcSeconds} -> err: ${err}`)
  }
}

export const dateEpochMsToIso = (utcMs) => {
  const fun = 'dateEpochMsToIso'
  try {
    return utcMs ? new Date(utcMs).toISOString() : nowISO()
  } catch (err) {
    consoleErr(mod, fun, `input: ${utcMs} -> err: ${err}`)
    throw new Error(`input: ${utcMs} -> err: ${err}`)
  }
}

// const [date, month, year] = new Date().toLocaleDateString('fr-FR').split('/')
// const [h, m, s] = new Date().toLocaleTimeString('fr-FR').split(/:| /)
// return `${year}/${month}/${date} ${h}:${m}:${s}`

export const dateToEpochMs = (date) => new Date(date).getUTCMilliseconds()

// -------------------------------------------------------------------------------------------------
// Arrays
// -------------------------------------------------------------------------------------------------
export const isArray = (anArray) => Array.isArray(anArray)
export const isNotEmptyArray = (anArray) => Array.isArray(anArray) && anArray.length > 0
export const isEmptyArray = (anArray) => Array.isArray(anArray) && anArray.length === 0
export const getLast = (array) => (Array.isArray(array) ? array[array.length - 1] : null)

// -------------------------------------------------------------------------------------------------
// Objects
// -------------------------------------------------------------------------------------------------
export const isObject = (obj) => Object.prototype.toString.call(obj) === '[object Object]'
//Object.keys(obj).length > 0
export const isEmptyObject = (obj) => isObject(obj) && Object.keys(obj).length === 0
export const isNotEmptyObject = (obj) => isObject(obj) && Object.keys(obj).length > 0

export const NOT_FOUND = '!_not_found_!'
export const quietAccess = (obj, prop) => {
  try {
    if (typeof obj[prop] === 'undefined') return NOT_FOUND
    return obj[prop]
  } catch {
    return NOT_FOUND
  }
}

/** !! TODO: treat object arrays! */
export const getPaths = async (root, parentKeyName) => {
  // if obj has no keys, abort
  if (isString(root) || Array.isArray(root) || Object.keys(root).length === 0) {
    return []
  }
  const keys = Object.keys(root)
  let rootSubPaths = []

  // console.log(beautify(root))

  await Promise.all(
    keys.map(async (key) => {
      const subObj = root[key]
      if (!subObj) return
      const keyPath = parentKeyName ? `${parentKeyName}.${key}` : `${key}`
      // console.log(`keyPath: ${keyPath}`)
      rootSubPaths.push(keyPath)
      if (isNotEmptyObject(subObj)) {
        const keyPaths = await getPaths(subObj, keyPath)
        rootSubPaths = rootSubPaths.concat(keyPaths)
        return true
      } else return false
    })
  )
  // console.log(beautify(rootSubPaths))
  return rootSubPaths
}

export const listPick = (objList, fieldList) => {
  const reshapedList = objList.map((obj) => pick(obj, fieldList))
  return reshapedList
}

export const filterOnValue = async (obj, predicate) => {
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

export const setSubProp = (obj, propArray, value) => objectPath.set(obj, propArray, value)

// -------------------------------------------------------------------------------------------------
// JSON
// -------------------------------------------------------------------------------------------------

/**
 *
 * @param {Object} obj a source object
 * @param {string} key the name of a property to omit in the source object
 * @returns An object without the named property
 */
export const omit = (obj, key) => {
  const { [key]: _, ...rest } = obj // NOSONAR
  return rest
}
const ARGV = omit(minimist(process.argv), '_')
console.log('CLI options:', ARGV)
export const getArgv = (opt) => (opt ? ARGV[opt] : ARGV)

export const isDefined = (val) => typeof val !== 'undefined'

export const isPropDefined = (obj, prop) => obj?.hasOwnProperty(prop)

export const isEmpty = (prop) => {
  const strProp = JSON.stringify(prop)
  return prop == '' || prop == '{}' || prop == '[]' || strProp == '{}' || strProp == '[]'
}

export const isNothing = (prop) => {
  return !prop || isEmpty(prop)
}

/**
 * Custom JSON beautifying function
 * @param {JSON} jsonObject: a JSON object
 * @param {String or number} options: JSON.stringify options. 4 or '\t' make it possible
 *                                    to display the JSON on several lines
 * @returns {String} JSON.stringify options
 */
export const beautify = (jsonObject, option) => {
  try {
    return isString(jsonObject)
      ? jsonObject
      : `${JSON.stringify(jsonObject, null, option).replace(/\\"/g, '"')}${option != null ? '\n' : ''}`
  } catch {
    return `${jsonToString(jsonObject, false)}`
  }
}

export const jsonToString = (jsonObject, shouldColorize = true) =>
  inspect(jsonObject, false, 5, shouldColorize)

/**
 * Clone a (JSON) object through JSON.stringify then JSON.parse (beware, it can be slow)
 * @param {JSON} jsonObject
 * @returns {JSON} The deep (dissociated) clone of the input object
 * @throws parameter 'jsonObject' is undefined, null or empty
 */
export const deepClone = (jsonObject) => JSON.parse(JSON.stringify(jsonObject))

// Helper function to recursively traverse and set null values in objB
export const setNullForMissingLeaves = (source, destination) => {
  const fun = 'setNullForMissingLeaves'
  // consoleLog(mod, fun)
  // consoleLog(mod, fun + '.source', beautify(source))
  // consoleLog(mod, fun + '.destination', beautify(destination))
  if (isObject(source) && isObject(destination)) {
    // consoleLog(mod, fun, 'isObject(source) && isObject(destination)')
    for (const key of Object.keys(source)) {
      // consoleLog(mod, fun, `key: ${key}, source.hasOwnProperty(key):${source.hasOwnProperty(key)}`)
      if (!key.startsWith('$') && !key.startsWith('_')) {
        // consoleLog(mod, 'setNullForMissingLeaves.source)', source[key])
        // consoleLog(mod, 'setNullForMissingLeaves.dest)', destination[key])
        if (destination[key] === undefined) {
          destination[key] = null
        } else if (isObject(source[key]) && isObject(destination[key]))
          setNullForMissingLeaves(source[key], destination[key])
      }
    }
  }
  return destination
}
export const deepCompareAndSetNull = (source, destination) => {
  // Create a deep copy of objB to avoid mutating the original object
  const updatedDestination = JSON.parse(JSON.stringify(destination))
  // Start the comparison and update
  setNullForMissingLeaves(source, updatedDestination)
  return updatedDestination
}

// -------------------------------------------------------------------------------------------------
//  Logging
// -------------------------------------------------------------------------------------------------
export const logWhere = (srcMod, srcFun) =>
  srcMod && srcFun ? `${srcMod} . ${srcFun}` : srcMod || srcFun

export const displayStr = (srcMod, srcFun, msg = '<-') => `[ ${logWhere(srcMod, srcFun)} ] ${msg}`

export const consoleLog = (srcMod, srcFun, msg = '<-') =>
  console.log('D', nowLocaleFormatted(), displayStr(srcMod, srcFun, msg))

export const consoleErr = (srcMod, srcFun, msg = 'No error message :(') =>
  console.error('E', nowLocaleFormatted(), displayStr(srcMod, srcFun, msg[TRACE] || msg))
