const mod = 'trslat'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { PATHS_GMD_TO_RUDI } from '../config/confMetadataTranslation/confGMDToRudi.js'
import { API_DATA_NAME_PROPERTY, API_METADATA_ID, API_METADATA_LOCAL_ID } from '../db/dbFields.js'
import { BadRequestError, NotImplementedError, RudiError } from './errors.js'
// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------

// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import { parseStringPromise } from 'xml2js'

// -------------------------------------------------------------------------------------------------
// Available input standards for translation
// -------------------------------------------------------------------------------------------------
const GMD = 'gmd'

export const AVAILABLE_INPUT_STANDARDS = [GMD]

// -------------------------------------------------------------------------------------------------
// Functions of translation of differents metadatas standards at differents formats to rudi metadata
// -------------------------------------------------------------------------------------------------

export const isAvailableMetadataStandard = (standard) => {
  return AVAILABLE_INPUT_STANDARDS.includes(standard)
}

// -------------------------------------------------------------------------------------------------
// Translation from XML format of differents metadatas standards to rudi metadata
// -------------------------------------------------------------------------------------------------

/**
 * Translate a metadata from an XML format (xml-dcat, xml-gmd, ...) to rudi metadata
 * @param {String} originMetadata the origin metadata to translate
 * @param {String} inputStandard the standard of the origin metadata (iso19115, dcat, ...)
 * @returns the rudi metadata
 */
export const translateXMLMetadata = async (originMetadata, inputStandard) => {
  const fun = 'translateXMLMetadata'
  let originMetadataParsed
  try {
    originMetadataParsed = await parseStringPromise(originMetadata) // parse from xml to js Object
  } catch (e) {
    throw new BadRequestError(`Problem in XML parsing to js Object`, mod, fun)
  }
  switch (
    inputStandard //choose the appropriate translation fonction according to inputStandard
  ) {
    case GMD:
      return await translateFromGMD(originMetadataParsed)
    default:
      throw new NotImplementedError(
        `Translation from ${inputStandard} to rudi metadata is not yet supported.`
      )
  }
}

/**
 * Translate from GMD at format js Object (parsed from XML with xml2js parser)
 * @param {Object} originMetadata
 */
const translateFromGMD = async (originMetadata) => {
  const fun = 'translateFromGMD'
  const newMetadata = {}
  fieldsTranslators.forEach((elem) => {
    newMetadata[elem.rudiField] = elem.translate(originMetadata)
  })
  return newMetadata
  // logI(mod, fun, originMetadata['gmd:MD_Metadata'])
  // const path_1 = ['gmd:MD_Metadata', 'gmd:fileIdentifier', 'gco:CharacterString']
  // const elem = await findElement(originMetadata, path_1)

  // const path_2 = ['gmd:MD_Metadata']
  // const param_value = await getXmlParam(originMetadata, path_2, 'xmlns:gmx')
  // logI(mod, fun, elem)
  // logI(mod, fun, param_value)
}

/**
 * General function to find an element in an metadata
 * @param {Object} metadata origin metadata, to find element in
 * @param {Array[String]} path path to the element in the metadata
 * @param {} condition condition
 * @param {Object} useDict dictionnary to use to translate found value
 * @returns the element at the path, in metadata
 */
const findElement = async (metadata, path, condition = undefined, useDict = undefined) => {
  const fun = 'findElement'
  const elem = await getElementWithPath(metadata, path)
  return elem
}

/**
 * Recursive function to get the element of metadata located at a path.
 * @param {Object} metadata the metadata we want to get an element from
 * @param {Array[String]} path the path to the element in the metadata
 * @param {Number} depth recursive parameter, represent the depth of the recursion in the tree
 * @returns the element, throw error if it can't be accessed
 */
const getElementWithPath = (metadata, path, depth = 0) => {
  const fun = 'getElementWithPath'
  try {
    const ind = path[depth]
    const result = metadata[ind]
    if (depth + 1 === path.length) {
      // logI(mod, fun, result + '  -final step-      ' + depth)
      return result
    } else {
      // logI(mod, fun, result + '        ' + depth)
      return getElementWithPath(arrayCheck(result), path, depth + 1)
    }
  } catch {
    throw new BadRequestError(
      `Element not reachable at path ${path}, in depth ${depth + 1}`,
      mod,
      fun
    )
  }
}

/**
 * Returns first element of obj if it is an array, else obj
 * @param {*} obj array or other
 * @returns first element of obj if is Array, else obj
 */
const arrayCheck = function (obj) {
  if (Array.isArray(obj)) {
    return obj[0]
  } else {
    return obj
  }
}

/**
 * Get an XML tag's parameter value (e.g. : tag <gmd:MD_Metadata xmlns="http://www.isotc211.org/2005/gmd"> has parameter xmlns with value "http://www.isotc211.org/2005/gmd")
 * @param {Object} metadata the metadata we want to access the parameter from
 * @param {Array[String]} path the path to the parameter
 * @param {String} paramName the name of the parameter
 */
const getXmlParam = async (metadata, path, paramName) => {
  const fun = 'getXmlParam'
  const tag = await getElementWithPath(metadata, path)
  let result
  if ('$' in tag) {
    result = tag['$']
  } else {
    throw new BadRequestError(
      `It seems there is no parameters for tag ${tag}, at path ${path}. Parameters of a tag must be at key '$'.`,
      mod,
      fun,
      path
    )
  }
  if (paramName in result) {
    return result[paramName]
  } else {
    throw new BadRequestError(`Parameter ${paramName} is not available at path ${path}`)
  }
}

class FieldTranslator {
  /**
   *  Class dealing with translation
   * @param {String} rudiField the rudi field it translates to
   * @param {Function} translationFunc the function to use for translation. It must take 3 args. 1st is origin metadata, second is path, third is other args in an array.
   * @param {Array} params parameters (like path) to use to translate metadata field.
   */
  constructor(rudiField, translationFunc, params) {
    this.rudiField = rudiField
    this.translationFunc = translationFunc
    this.params = params
  }
  translate(originMetadata) {
    const fun = 'translate'
    const path = this.params.path
    const args = this.params.otherArgs
    const result = this.translationFunc(originMetadata, path, args)
    return result
  }
}

// -------------------------------------------------------------------------------------------------
// Translation functions
// -------------------------------------------------------------------------------------------------

/**
 * Get the element located at path in the Metadata
 * @param {String} metaData
 * @param {Array[String]} path
 * @param {Array} args
 * @returns  the element located at path in the metaData
 */
const translateStraightFromPath = function (metaData, path, args = undefined) {
  let result
  try {
    result = getElementWithPath(metaData, path)
    return result
  } catch (err) {
    throw new RudiError(err)
  }
}

// -------------------------------------------------------------------------------------------------
// Translators of GMD to Rudi Fields
// -------------------------------------------------------------------------------------------------

const fieldsTranslators = [
  new FieldTranslator(API_METADATA_ID, translateStraightFromPath, {
    path: PATHS_GMD_TO_RUDI[API_METADATA_ID],
  }),
  new FieldTranslator(API_METADATA_LOCAL_ID, translateStraightFromPath, {
    path: PATHS_GMD_TO_RUDI[API_METADATA_LOCAL_ID],
  }),
  new FieldTranslator(API_DATA_NAME_PROPERTY, translateStraightFromPath, {
    path: PATHS_GMD_TO_RUDI[API_DATA_NAME_PROPERTY],
  }),
]
