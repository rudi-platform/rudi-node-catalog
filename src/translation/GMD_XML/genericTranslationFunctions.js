const mod = 'genTrslatFun'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import {
  API_LICENCE_CUSTOM_LABEL,
  API_LICENCE_CUSTOM_URI,
  API_LICENCE_TYPE,
  LicenceTypes,
} from '../../db/dbFields.js'
import { BadRequestError, RudiError } from '../../utils/errors.js'
import { accessProperty } from '../../utils/jsonAccess.js'
import { logI } from '../../utils/logging.js'

// -------------------------------------------------------------------------------------------------
// Generic Translation functions.
// !!! All these functions must be async functions, and have the same parameters structure : (metadata, path, ...args) !!!
// -------------------------------------------------------------------------------------------------

/**
 * Get the element located at path in the object. If element is an array, returns the first element.
 * @param {Object} inputObject origin object to pick information in
 * @param {Array[String]} path the path to the field in the origin object
 * @param {Array} args other arguments
 * @returns  the element located at path in the inputObject
 */
export const translateStraightFromPath = async (inputObject, path) =>
  getFirstElementWithPath(inputObject, path)

/**
 * Gives the parameter in the XML's tag located at path.
 * @param {Object} inputObject origin object to pick info in
 * @param {Array[String]} path path to the
 * @param {*} args
 * @returns
 */
export const translateStraightFromXmlParam = async (inputObject, path, args) => {
  const fun = 'translateStraightFromXmlParam'
  try {
    if (!('paramName' in args)) {
      throw Error(`Function ${fun} must have parameter args with property paramName !`)
    }
    const paramName = args.paramName
    return getXmlParam(inputObject, path, paramName)
  } catch (e) {
    throw RudiError.treatError(mod, fun, e)
  }
}

// -------------------------------------------------------------------------------------------------
// Specific functions to help translation from XML format, parsed with xml2js parser.
// -------------------------------------------------------------------------------------------------

export const createCustomLicence = (label) => ({
  [API_LICENCE_TYPE]: LicenceTypes.Custom,
  [API_LICENCE_CUSTOM_LABEL]: label,
  [API_LICENCE_CUSTOM_URI]: label, // !! no available custom URI ?
})

/**
 * Recursive function to get the element of object located at a path.
 * @param {Object} object the object we want to get an element from
 * @param {Array[String]} path the path to the element in the object
 * @param {Number} depth recursive parameter, represent the depth of the recursion in the tree
 * @returns the element, throw error if it can't be accessed
 */
export const getElementWithPath = (object, path, depth = 0) => {
  const fun = 'getElementWithPath'
  try {
    const ind = path?.[depth]
    const result = object?.[ind]
    if (result === undefined) {
      throw new BadRequestError(
        `Element not reachable at path [${path}], in depth ${depth}`,
        mod,
        fun
      )
    }
    if (depth + 1 === path.length) {
      // logI(mod, fun, result + '  -final step-      ' + depth))
      return result
    }
    return getElementWithPath(arrayCheck(result), path, depth + 1)
  } catch (e) {
    throw RudiError.treatError(mod, fun, e)
  }
  // logI(mod, fun, result + '        ' + depth)
}

/**
 * Find an element at path of object. If it doesn't exist, return undefined.
 * @param {Object} object the object we want to get an element from
 * @param {Array[String]} path the path to the element in the object
 * @returns the element if it exists, else undefined
 */
export const findElementWithPath = (object, path) => {
  const fun = 'findElementWithPath'
  try {
    return getElementWithPath(object, path)
  } catch (e) {
    logI(mod, fun, `The following error was intentionnaly skipped : ${e}.`)
  }
}

/**
 * Finds the first element located at path in the object.
 * @param {Object} object
 * @param {Array[String]} path
 * @returns
 */
export const findFirstElementWithPath = (object, path) =>
  arrayCheck(findElementWithPath(object, path))

/**
 * Returns the first element of x if it is an array, else x itself
 * @param {*} x array or other
 * @returns first element of obj if is Array, else obj
 */
export const arrayCheck = (x) => {
  const fun = 'arrayCheck'
  let result
  try {
    if (Array.isArray(x) && x.length > 0) {
      result = x[0]
    } else {
      result = x
    }
    return result
  } catch (e) {
    throw RudiError.treatError(mod, fun, e)
  }
}

/**
 * Gives the first element located at path in the object. If the element is not an array, returns the element.
 * @param {Object} object
 * @param {Array[String]} path
 * @returns
 */
export const getFirstElementWithPath = (object, path) =>
  arrayCheck(getElementWithPath(object, path))

/**
 * Get an XML tag's parameter value (e.g. : tag <gmd:MD_Metadata xmlns="http://www.isotc211.org/2005/gmd"> has parameter xmlns with value "http://www.isotc211.org/2005/gmd")
 * @param {Object} inputObject the source object to get the parameter from. It is supposed to be parsed in json.
 * @param {Array[String]} path the path to the parameter
 * @param {String} paramName the name of the parameter
 */
export const getXmlParam = (inputObject, path, paramName) => {
  const fun = 'getXmlParam'
  let result
  try {
    try {
      const tag = getFirstElementWithPath(inputObject, path)
      result = tag?.['$']
    } catch {
      throw new BadRequestError(
        `It seems there is no parameters for the tag located at path ${path}. Parameters of a tag must be at key '$'.`,
        mod,
        fun
      )
    }
    if (paramName in result) {
      return result[paramName]
    } else {
      throw new BadRequestError(`Parameter ${paramName} is not available at path ${path}`, mod, fun)
    }
  } catch (e) {
    throw RudiError.treatError(mod, fun, e)
  }
}

/**
 * Finds an XML tag's parameter value (e.g. : tag <gmd:MD_Metadata xmlns="http://www.isotc211.org/2005/gmd"> has parameter xmlns with value "http://www.isotc211.org/2005/gmd"). If not found, return undefined
 * @param {Object} inputObject the source object to get the parameter from. It is supposed to be parsed in json.
 * @param {Array[String]} path the path to the tag
 * @param {String} paramName the name of the parameter
 * @returns the param if found, else undefined
 */
export const findXmlParam = (inputObject, path, paramName) => {
  const fun = 'findXmlParam'
  try {
    const tag = getFirstElementWithPath(inputObject, path)
    return tag?.['$']?.[paramName]
  } catch (e) {
    throw RudiError.treatError(mod, fun, e)
  }
}

/**
 * Shortcut of accessProperty for path.
 * @param {Object} pathsDict
 * @param {String} rudiField
 * @returns
 */
export const getPath = (pathsDict, rudiField) =>
  accessProperty(accessProperty(pathsDict, rudiField), 'path')

/**
 * Shortcut of accessProperty for args.
 * @param {Object} pathsDict
 * @param {String} rudiField
 * @returns
 */
export const getArgs = (pathsDict, rudiField) =>
  accessProperty(accessProperty(pathsDict, rudiField), 'args')
