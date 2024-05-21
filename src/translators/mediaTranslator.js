const mod = 'mediaTrsltr'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import {
  AVAILABLE_SERVICE_PROTOCOL,
  FORMAT_XML,
  PATHS_GMD_TO_RUDI,
  STANDARD_GMD,
} from '../config/confTranslation/gmd/confGmdXml.js'
import {
  API_MEDIA_CAPTION,
  API_MEDIA_CONNECTOR,
  API_MEDIA_INTERFACE_CONTRACT,
  API_MEDIA_NAME,
  API_MEDIA_PROPERTY,
  API_MEDIA_TYPE,
  API_PUB_URL,
} from '../db/dbFields.js'
import { MediaTypes } from '../definitions/models/Media.js'
import {
  getArgs,
  getFirstElementWithPath,
  getPath,
  translateStraightFromPath,
} from './genericTranslationFunctions.js'
import { FieldTranslator, ObjectTranslator } from './genericTranslator.js'

// -------------------------------------------------------------------------------------------------
// Translation functions for Media.
// !!! All these functions must be async and have the same parameters structure : (inputObject, path, args) !!!
// -------------------------------------------------------------------------------------------------

export const translateOneMedia = async (inputObject, path, args) => {
  const fun = 'translateOneMedia'
  let mediaTranslated = await GmdXmlToRudiMediaTranslator.translateInputObject(inputObject)
  return mediaTranslated
}

export const translateMediaType = async (inputObject, path, args) => {
  const fun = 'translateMediaType'
  const protocol = getFirstElementWithPath(inputObject, getPath(args, API_MEDIA_INTERFACE_CONTRACT))
  if (AVAILABLE_SERVICE_PROTOCOL.includes(protocol)) {
    return MediaTypes.Service
  } else {
    return ''
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
    new ObjectTranslator(
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
    ),
  ]
)
