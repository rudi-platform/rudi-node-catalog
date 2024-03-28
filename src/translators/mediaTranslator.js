const mod = 'mediaTrsltr'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import {
  FORMAT_XML,
  PATHS_GMD_TO_RUDI,
  STANDARD_GMD,
} from '../config/confTranslation/gmd/confGmdXml.js'
import { OBJ_MEDIA } from '../config/constApi.js'
import {
  API_MEDIA_CAPTION,
  API_MEDIA_CONNECTOR,
  API_MEDIA_INTERFACE_CONTRACT,
  API_MEDIA_NAME,
  API_MEDIA_PROPERTY,
  API_PUB_URL,
} from '../db/dbFields.js'
import { getPath, translateStraightFromPath } from './genericTranslationFunctions.js'
import { FieldTranslator, ObjectTranslator } from './genericTranslator.js'

// -------------------------------------------------------------------------------------------------
// Translation functions for Media.
// !!! All these functions must have the same parameters structure : (metadata, path, args) !!!
// -------------------------------------------------------------------------------------------------

export const translateOneMedia = async function (inputObject, path, args) {
  return await mediaTranslator.translate(inputObject)
}
// -------------------------------------------------------------------------------------------------
// Fields Translators
// -------------------------------------------------------------------------------------------------

const argsGmdMedia = PATHS_GMD_TO_RUDI[API_MEDIA_PROPERTY].args

//translators for Media
const fieldTranslatorsMediaGmdXml = [
  new FieldTranslator(API_MEDIA_NAME, translateStraightFromPath, {
    path: getPath(argsGmdMedia, API_MEDIA_NAME),
  }),
  new FieldTranslator(API_MEDIA_CAPTION, translateStraightFromPath, {
    path: getPath(argsGmdMedia, API_MEDIA_CAPTION),
  }),
  new FieldTranslator(
    API_MEDIA_CONNECTOR,
    async (inputObject, path, args) => {
      return await connectorTranslator.translate(inputObject)
    },
    {}
  ),
]

//translators for the Connector object
const fieldTranslatorsConnectorGmdXml = [
  new FieldTranslator(API_PUB_URL, translateStraightFromPath, {
    path: getPath(argsGmdMedia, API_PUB_URL),
  }),
  new FieldTranslator(API_MEDIA_INTERFACE_CONTRACT, translateStraightFromPath, {
    path: getPath(argsGmdMedia, API_MEDIA_INTERFACE_CONTRACT),
  }),
]

const mediaTranslator = new ObjectTranslator(
  OBJ_MEDIA,
  STANDARD_GMD,
  FORMAT_XML,
  fieldTranslatorsMediaGmdXml
)
const connectorTranslator = new ObjectTranslator(
  API_MEDIA_CONNECTOR,
  STANDARD_GMD,
  FORMAT_XML,
  fieldTranslatorsConnectorGmdXml
)
