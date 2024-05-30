const mod = 'mediaTrsltr'
// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import { v4 as UUIDv4 } from 'uuid'
// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------

import {
  FORMAT_XML,
  PATHS_GMD_TO_RUDI,
  STANDARD_GMD,
} from '../../config/confTranslation/GMD_XML/confGMDXML.js'
import { OBJ_MEDIA } from '../../config/constApi.js'
import {
  API_MEDIA_CAPTION,
  API_MEDIA_CONNECTOR,
  API_MEDIA_ID,
  API_MEDIA_INTERFACE_CONTRACT,
  API_MEDIA_NAME,
  API_MEDIA_PROPERTY,
  API_MEDIA_TYPE,
  API_PUB_URL,
} from '../../db/dbFields.js'
import { getObject } from '../../db/dbQueries.js'
import { MediaTypes } from '../../definitions/models/Media.js'
import { RudiError } from '../../utils/errors.js'
import { beautify } from '../../utils/jsUtils.js'
import { logI } from '../../utils/logging.js'
import { FieldTranslator, ObjectTranslator } from '../translators.js'
import {
  findFirstElementWithPath,
  getArgs,
  getPath,
  translateStraightFromPath,
} from './genericTranslationFunctions.js'

// -------------------------------------------------------------------------------------------------
// Translation functions for Media.
// !!! All these functions must be async and have the same parameters structure : (inputObject, path, args) !!!
// -------------------------------------------------------------------------------------------------

// TODO : deal with the case where inputMedia is of type FILE (it is therefore needed to add 'checksum' and 'size' fields)
/**
 * Translates rudi field 'media_type' from xml gmd.
 * @param {Object} inputObject
 * @param {Array[String]} path
 * @param {*} args
 * @returns
 */
const translateMediaType = () => MediaTypes.Service

/**
 * Translates rudi field 'connector' from xml gmd. Uses translator object GmdXmlToRudiMediaConnectorTranslator
 * @param {Object} inputObject
 * @param {Array[String]} path
 * @param {*} args
 * @returns
 */
const translateMediaConnector = async (inputObject) => {
  const fun = 'translateMediaConnector'
  try {
    return await GmdXmlToRudiMediaConnectorTranslator.translateInputObject(inputObject)
  } catch (e) {
    throw RudiError.treatError(mod, fun, e)
  }
}

/**
 * Translates rudi field 'media_id' from xml gmd. Tries first to find the ID field in the media. If it is not found, tries to find an existing ID with the same URL. If no such media exists, creates a new UUIDV4.
 * @param {Object} inputObject
 * @param {Array[String]} path
 * @param {*} args
 * @returns
 */
const translateMediaId = async (inputObject, path, args) => {
  const fun = 'translateMediaId'
  try {
    const pathMediaID = getPath(args, API_MEDIA_ID)
    const argsConnnectorGmdXml = getArgs(argsMediaGmdXml, API_MEDIA_CONNECTOR)
    const pathConnectorGmdXml = getPath(args, API_MEDIA_CONNECTOR)

    let mediaID = findFirstElementWithPath(inputObject, pathMediaID)

    if (mediaID === undefined) {
      logI(
        mod,
        fun,
        `No ID was found for media ${beautify(inputObject)}. Tries to find an existing media with the same URL.`
      )
      const mediaConnector = await translateMediaConnector(
        inputObject,
        pathConnectorGmdXml,
        argsConnnectorGmdXml
      )
      const mediaURL = mediaConnector?.[API_PUB_URL]
      mediaID = await findMediaIdWithURL(mediaURL)
    }
    return mediaID
  } catch (e) {
    throw RudiError.treatError(mod, fun, e)
  }
}

// -------------------------------------------------------------------------------------------------
// Tools for media translations
// -------------------------------------------------------------------------------------------------

/**
 * Try to find a media id whose media has the same url as mediaURL. If no such media exists, returns a new UUIDV4
 * @param {String} mediaURL The URL we want to find the corresponding ID.
 * @returns the matching UUID, or a new one.
 */
export const findMediaIdWithURL = async (mediaURL) => {
  const fun = 'findMediaWithURL'
  let result
  try {
    const rudiObj = await getObject(
      OBJ_MEDIA,
      { [`${API_MEDIA_CONNECTOR}.${API_PUB_URL}`]: mediaURL },
      false
    )
    result = rudiObj?.[API_MEDIA_ID]
    if (result === undefined) {
      logI(mod, fun, `No media with url '${mediaURL}' was found in database. New id is created.`)
      result = UUIDv4()
    }
    return result
  } catch (e) {
    throw RudiError.treatError(mod, fun, e)
  }
}

// -------------------------------------------------------------------------------------------------
// Media Translator Object
// -------------------------------------------------------------------------------------------------

const argsMediaGmdXml = getArgs(PATHS_GMD_TO_RUDI, API_MEDIA_PROPERTY)
const pathMediaGmdXml = getPath(PATHS_GMD_TO_RUDI, API_MEDIA_PROPERTY)

const pathConnectorGmdXml = getPath(argsMediaGmdXml, API_MEDIA_CONNECTOR)
const argsConnnectorGmdXml = getArgs(argsMediaGmdXml, API_MEDIA_CONNECTOR)

export const GmdXmlToRudiMediaTranslator = new ObjectTranslator(
  API_MEDIA_PROPERTY,
  STANDARD_GMD,
  FORMAT_XML,
  true,
  pathMediaGmdXml,
  argsMediaGmdXml,
  [
    new FieldTranslator(API_MEDIA_ID, translateMediaId, true, pathMediaGmdXml, argsMediaGmdXml),
    new FieldTranslator(
      API_MEDIA_NAME,
      translateStraightFromPath,
      false,
      getPath(argsMediaGmdXml, API_MEDIA_NAME)
    ),
    new FieldTranslator(
      API_MEDIA_CAPTION,
      translateStraightFromPath,
      false,
      getPath(argsMediaGmdXml, API_MEDIA_CAPTION)
    ),
    new FieldTranslator(
      API_MEDIA_TYPE,
      translateMediaType,
      true,
      pathConnectorGmdXml,
      argsConnnectorGmdXml
    ),
    new FieldTranslator(
      API_MEDIA_CONNECTOR,
      translateMediaConnector,
      true,
      pathConnectorGmdXml,
      argsConnnectorGmdXml
    ),
  ]
)

const GmdXmlToRudiMediaConnectorTranslator = new ObjectTranslator(
  API_MEDIA_CONNECTOR,
  STANDARD_GMD,
  FORMAT_XML,
  true,
  pathConnectorGmdXml,
  argsConnnectorGmdXml,
  [
    new FieldTranslator(
      API_PUB_URL,
      translateStraightFromPath,
      true,
      getPath(argsConnnectorGmdXml, API_PUB_URL)
    ),
    new FieldTranslator(
      API_MEDIA_INTERFACE_CONTRACT,
      translateStraightFromPath,
      false,
      getPath(argsConnnectorGmdXml, API_MEDIA_INTERFACE_CONTRACT)
    ),
  ]
)
