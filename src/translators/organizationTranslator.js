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
  arrayCheck,
  getArgs,
  getElementWithPath,
  getPath,
  translateStraightFromPath,
} from './genericTranslationFunctions.js'
import { FieldTranslator, ObjectTranslator } from './genericTranslator.js'
import {} from './translationTools.js'

// -------------------------------------------------------------------------------------------------
// Translation functions for organizations.
// !!! All these functions must have the same parameters structure : (inputObject, path, ...args) !!!
// -------------------------------------------------------------------------------------------------

const translateOrgAddress = async function (metadata, path, args) {
  const fun = 'translateOrgAddress'
  let relativePathCharacter = args.relativePathCharacter
  let result = ''
  for await (const elem of args.fieldsToConcat) {
    try {
      let addressField = arrayCheck(
        await getElementWithPath(metadata, path.concat([elem, relativePathCharacter]))
      )
      result += addressField + ', '
    } catch (err) {
      throw RudiError.treatError(mod, fun, err)
    }
  }
  return result.substring(0, result.length - 2)
}

// -------------------------------------------------------------------------------------------------
// Fields Translators for organizations
// -------------------------------------------------------------------------------------------------

const pathOrgGmdXml = getPath(PATHS_GMD_TO_RUDI, API_DATA_PRODUCER_PROPERTY)
const argsOrgGmdXml = getArgs(PATHS_GMD_TO_RUDI, API_DATA_PRODUCER_PROPERTY)

export const GmdXmlToRudiOrgaTranslator = new ObjectTranslator(
  API_DATA_PRODUCER_PROPERTY,
  STANDARD_GMD,
  FORMAT_XML,
  true,
  pathOrgGmdXml,
  argsOrgGmdXml,
  [
    new FieldTranslator(
      API_ORGANIZATION_NAME,
      translateStraightFromPath,
      false,
      pathOrgGmdXml.concat(getPath(argsOrgGmdXml, API_ORGANIZATION_NAME))
      // getArgs(argsOrgGmdXml, API_ORGANIZATION_NAME)
    ),
    new FieldTranslator(
      API_ORGANIZATION_ADDRESS,
      translateOrgAddress,
      false,
      pathOrgGmdXml.concat(getPath(argsOrgGmdXml, API_ORGANIZATION_ADDRESS)),
      getArgs(argsOrgGmdXml, API_ORGANIZATION_ADDRESS)
    ),
  ]
)
