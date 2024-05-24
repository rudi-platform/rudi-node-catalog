const mod = 'mediaTrsltr'
// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import { v4 as UUIDv4 } from 'uuid'
// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------

import {
  AVAILABLE_DOWNLOAD_PROTOCOL,
  AVAILABLE_SERVICE_PROTOCOL,
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
import { BadRequestError, RudiError } from '../../utils/errors.js'
import { beautify } from '../../utils/jsUtils.js'
import { logI } from '../../utils/logging.js'
import { FieldTranslator, ObjectTranslator } from '../translators.js'
import {
  getArgs,
  getFirstElementWithPath,
  getPath,
  translateStraightFromPath,
} from './genericTranslationFunctions.js'

// -------------------------------------------------------------------------------------------------
// Translation functions for Media.
// !!! All these functions must be async and have the same parameters structure : (inputObject, path, args) !!!
// -------------------------------------------------------------------------------------------------

const translateMediaType = async (inputObject, path, args) => {
  const fun = 'translateMediaType'
  let result
  try {
    const protocol = getFirstElementWithPath(
      inputObject,
      getPath(args, API_MEDIA_INTERFACE_CONTRACT)
    )
    if (AVAILABLE_SERVICE_PROTOCOL.includes(protocol)) {
      result = MediaTypes.Service
    } else if (AVAILABLE_DOWNLOAD_PROTOCOL.includes(protocol)) {
      result = MediaTypes.Service
    } else {
      throw new BadRequestError(
        `Protocol '${protocol}' was not recognized for media ${beautify(inputObject)}'. Available SERVICE protocols are [${AVAILABLE_SERVICE_PROTOCOL}]. Available FILE protocols are [${AVAILABLE_DOWNLOAD_PROTOCOL}]`,
        mod,
        fun
      )
    }
    return result
  } catch (e) {
    throw RudiError.treatError(mod, fun, e)
  }
}

const translateMediaConnector = async (inputObject, path, args) => {
  const fun = 'translateMediaConnector'
  try {
    return await GmdXmlToRudiMediaConnectorTranslator.translateInputObject(inputObject)
  } catch (e) {
    throw RudiError.treatError(mod, fun, e)
  }
}

const translateMediaId = async (inputObject, path, args) => {
  const fun = 'translateMediaId'
  let result
  try {
    const mediaConnector = await translateMediaConnector(inputObject, path, args)
    const mediaURL = mediaConnector?.[API_PUB_URL]
    const rudiObj = await getObject(
      OBJ_MEDIA,
      { [API_MEDIA_CONNECTOR]: { [API_PUB_URL]: mediaURL } },
      false
    )
    result = rudiObj?.[API_MEDIA_ID]
    if (result == undefined) {
      logI(mod, fun, `No media with url '${mediaURL}' was found in database. New id is created.`)
      result = UUIDv4()
    }
    return result
  } catch (e) {
    throw RudiError.treatError(mod, fun, e)
  }
}

export const findMediaIdWithURL = async (mediaURL) => {
  const fun = 'findMediaWithURL'
  let result
  try {
    const rudiObj = await getObject(
      OBJ_MEDIA,
      { [API_MEDIA_CONNECTOR]: { [API_PUB_URL]: mediaURL } },
      false
    )
    result = rudiObj?.[API_MEDIA_ID]
    if (result == undefined) {
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
    new FieldTranslator(
      API_MEDIA_ID,
      translateMediaId,
      true,
      pathConnectorGmdXml,
      argsConnnectorGmdXml
    ),
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
      false,
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
