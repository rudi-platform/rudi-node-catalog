const mod = 'orgTrsltr'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import {
  FORMAT_XML,
  PATHS_GMD_TO_RUDI,
  STANDARD_GMD,
} from '../config/confTranslation/gmd/confGmdXml.js'
import {
  API_DATA_PRODUCER_PROPERTY,
  API_ORGANIZATION_ADDRESS,
  API_ORGANIZATION_NAME,
} from '../db/dbFields.js'
import { RudiError } from '../utils/errors.js'
import {
  getArgs,
  getFirstElementWithPath,
  getPath,
  translateStraightFromPath,
} from './genericTranslationFunctions.js'
import { FieldTranslator, ObjectTranslator } from './genericTranslator.js'
import {} from './translationTools.js'

// -------------------------------------------------------------------------------------------------
// Translation functions for organizations.
// !!! All these functions must have the same parameters structure : (inputObject, path, ...args) !!!
// -------------------------------------------------------------------------------------------------

const translateOrgAddress = async (metadata, path, args) => {
  const fun = 'translateOrgAddress'
  try {
    let relativePathCharacter = args.relativePathCharacter
    let result = ''
    for (const elem of args.fieldsToConcat) {
      let addressField = getFirstElementWithPath(
        metadata,
        path.concat([elem, relativePathCharacter])
      )
      result += addressField + ', '
    }
    return result.substring(0, result.length - 2)
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

// -------------------------------------------------------------------------------------------------
// Fields Translators for organizations
// -------------------------------------------------------------------------------------------------

const argsOrgGmdXml = getArgs(PATHS_GMD_TO_RUDI, API_DATA_PRODUCER_PROPERTY)

export const GmdXmlToRudiOrgaTranslator = new ObjectTranslator(
  API_DATA_PRODUCER_PROPERTY,
  STANDARD_GMD,
  FORMAT_XML,
  true,
  [],
  argsOrgGmdXml,
  [
    new FieldTranslator(
      API_ORGANIZATION_NAME,
      translateStraightFromPath,
      false,
      getPath(argsOrgGmdXml, API_ORGANIZATION_NAME)
      // getArgs(argsOrgGmdXml, API_ORGANIZATION_NAME)
    ),
    new FieldTranslator(
      API_ORGANIZATION_ADDRESS,
      translateOrgAddress,
      false,
      getPath(argsOrgGmdXml, API_ORGANIZATION_ADDRESS),
      getArgs(argsOrgGmdXml, API_ORGANIZATION_ADDRESS)
    ),
  ]
)
