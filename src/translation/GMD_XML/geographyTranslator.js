const mod = 'geoTrsltr'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import {
  FORMAT_XML,
  PATHS_GMD_TO_RUDI,
  STANDARD_GMD,
} from '../../config/confTranslation/GMD_XML/confGMDXML.js'
import {
  API_GEOGRAPHY,
  API_GEO_BBOX_EAST,
  API_GEO_BBOX_NORTH,
  API_GEO_BBOX_PROPERTY,
  API_GEO_BBOX_SOUTH,
  API_GEO_BBOX_WEST,
} from '../../db/dbFields.js'
import { FieldTranslator, ObjectTranslator } from '../translators.js'
import { getArgs, getPath, translateStraightFromPath } from './genericTranslationFunctions.js'

// -------------------------------------------------------------------------------------------------
// Geography Translator Object
// -------------------------------------------------------------------------------------------------

const argsGeoGmdXml = getArgs(PATHS_GMD_TO_RUDI, API_GEOGRAPHY)
const pathGeoGmdXml = getPath(PATHS_GMD_TO_RUDI, API_GEOGRAPHY)

const pathBboxGmdXml = pathGeoGmdXml.concat(getPath(argsGeoGmdXml, API_GEO_BBOX_PROPERTY))
const argsBboxGmdXml = getArgs(argsGeoGmdXml, API_GEO_BBOX_PROPERTY)

export const GmdXmlToRudiGeoTranslator = new ObjectTranslator(
  API_GEOGRAPHY,
  STANDARD_GMD,
  FORMAT_XML,
  false,
  pathGeoGmdXml,
  argsGeoGmdXml,
  [
    new ObjectTranslator(
      API_GEO_BBOX_PROPERTY,
      STANDARD_GMD,
      FORMAT_XML,
      false,
      pathGeoGmdXml.concat(getPath(argsGeoGmdXml, API_GEO_BBOX_PROPERTY)),
      {},
      [
        new FieldTranslator(
          API_GEO_BBOX_WEST,
          translateStraightFromPath,
          false,
          pathBboxGmdXml.concat(getPath(argsBboxGmdXml, API_GEO_BBOX_WEST))
        ),
        new FieldTranslator(
          API_GEO_BBOX_EAST,
          translateStraightFromPath,
          false,
          pathBboxGmdXml.concat(getPath(argsBboxGmdXml, API_GEO_BBOX_EAST))
        ),
        new FieldTranslator(
          API_GEO_BBOX_NORTH,
          translateStraightFromPath,
          false,
          pathBboxGmdXml.concat(getPath(argsBboxGmdXml, API_GEO_BBOX_NORTH))
        ),
        new FieldTranslator(
          API_GEO_BBOX_SOUTH,
          translateStraightFromPath,
          false,
          pathBboxGmdXml.concat(getPath(argsBboxGmdXml, API_GEO_BBOX_SOUTH))
        ),
      ]
    ),
  ]
)
