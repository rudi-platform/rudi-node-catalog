const mod = 'genTrslatFun'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { BadRequestError, RudiError } from '../utils/errors.js'
import { accessProperty } from '../utils/jsonAccess.js'
// -------------------------------------------------------------------------------------------------
// Generic Translation functions.
// !!! All these functions must have the same parameters structure : (metadata, path, ...args) !!!
// -------------------------------------------------------------------------------------------------

/**
 * Get the element located at path in the object
 * @param {Object} inputObject origin object to pick information in
 * @param {Array[String]} path the path to the field in the origin object
 * @param {Array} args other arguments
 * @returns  the element located at path in the inputObject
 */
export const translateStraightFromPath = async function (inputObject, path, args = []) {
  const fun = 'translateStraightFromPath'
  let result
  try {
    result = await getFirstElementWithPath(inputObject, path)
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
  return result
}

export const translateStraightFromXmlParam = async function (inputObject, path, args) {
  const fun = 'translateStraightFromXmlParam'
  if (!('paramName' in args)) {
    throw RudiError.treatError(
      mod,
      fun,
      `Function ${fun} must have parameter args with property paramName !`
    )
  }
  const paramName = args.paramName
  let result
  try {
    result = await getXmlParam(inputObject, path, paramName)
  } catch (e) {
    throw RudiError.treatError(mod, fun, e)
  }
  return result
}

/**
 * Recursive function to get the element of object located at a path.
 * @param {Object} object the object we want to get an element from
 * @param {Array[String]} path the path to the element in the metadata
 * @param {Number} depth recursive parameter, represent the depth of the recursion in the tree
 * @returns the element, throw error if it can't be accessed
 */
export const getElementWithPath = async (object, path, depth = 0) => {
  const fun = 'getElementWithPath'
  try {
    const ind = path[depth]
    const result = object[ind]
    if (depth + 1 === path.length) {
      // logI(mod, fun, result + '  -final step-      ' + depth)
      return result
    } else {
      // logI(mod, fun, result + '        ' + depth)
      return await getElementWithPath(arrayCheck(result), path, depth + 1)
    }
  } catch (e) {
    throw new BadRequestError(
      `Element not reachable at path ${path}}, in depth ${depth + 1}`,
      mod,
      fun
    )
  }
}

/**
 * Find an element at path of object. If it doesn't exist, return undefined.
 * @param {Object} object
 * @param {Array[String]} path
 * @returns
 */
export const findElementWithPath = async (object, path) => {
  const fun = 'findElementWithPath'
  let result
  try {
    result = await getElementWithPath(object, path)
  } catch {
    return result
  }
  return result
}

/**
 * Returns first element of obj if it is an array, else obj
 * @param {*} obj array or other
 * @returns first element of obj if is Array, else obj
 */
export const arrayCheck = (obj) => {
  if (Array.isArray(obj) && obj.length > 0) {
    return obj[0]
  } else {
    return obj
  }
}

export const getFirstElementWithPath = async (object, path) => {
  return arrayCheck(await getElementWithPath(object, path))
}

// -------------------------------------------------------------------------------------------------
// Specific functions to help translation from XML format, parsed with xml2js parser
// -------------------------------------------------------------------------------------------------

/**
 * Get an XML tag's parameter value (e.g. : tag <gmd:MD_Metadata xmlns="http://www.isotc211.org/2005/gmd"> has parameter xmlns with value "http://www.isotc211.org/2005/gmd")
 * @param {Object} inputObject the source object to get the parameter from. It is supposed to be parsed in json.
 * @param {Array[String]} path the path to the parameter
 * @param {String} paramName the name of the parameter
 */
export const getXmlParam = async (inputObject, path, paramName) => {
  const fun = 'getXmlParam'
  let tag = arrayCheck(await getElementWithPath(inputObject, path))
  let result
  try {
    result = tag['$']
  } catch {
    throw RudiError.treatError(
      mod,
      fun,
      `It seems there is no parameters for the tag located at path ${path}. Parameters of a tag must be at key '$'.`,
      path
    )
  }
  if (paramName in result) {
    return result[paramName]
  } else {
    throw RudiError.treatError(
      mod,
      fun,
      `Parameter ${paramName} is not available at path ${path}`,
      path
    )
  }
}

/**
 * Finds an XML tag's parameter value (e.g. : tag <gmd:MD_Metadata xmlns="http://www.isotc211.org/2005/gmd"> has parameter xmlns with value "http://www.isotc211.org/2005/gmd"). If not found, return undefined
 * @param {Object} inputObject the source object to get the parameter from. It is supposed to be parsed in json.
 * @param {Array[String]} path the path to the tag
 * @param {String} paramName the name of the parameter
 * @returns the param if found, else undefined
 */
export const findXmlParam = async function (inputObject, path, paramName) {
  const fun = 'findXmlParam'
  let tag = arrayCheck(await getElementWithPath(inputObject, path))
  let result
  if ('$' in tag) {
    result = tag['$']
  }
  if (paramName in result) {
    return result[paramName]
  }
  return undefined
}
// -------------------------------------------------------------------------------------------------
// Tools to access safely to params of Object.
// -------------------------------------------------------------------------------------------------

export const getPath = function (pathsDict, rudiField) {
  return accessProperty(accessProperty(pathsDict, rudiField), 'path')
}

export const getArgs = function (pathsDict, rudiField) {
  return accessProperty(accessProperty(pathsDict, rudiField), 'args')
}
