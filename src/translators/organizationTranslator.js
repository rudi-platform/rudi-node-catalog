const mod = 'orgTrsltr'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { PATHS_GMD_TO_RUDI } from '../config/confTranslation/gmd/confGmdXml.js'
import {
  API_DATA_PRODUCER_PROPERTY,
  API_ORGANIZATION_ADDRESS,
  API_ORGANIZATION_NAME,
} from '../db/dbFields.js'
import { RudiError } from '../utils/errors.js'
import {
  arrayCheck,
  getElementWithPath,
  translateStraightFromPath,
} from './genericTranslationFunctions.js'
import { FieldTranslator } from './genericTranslator.js'
import {} from './translationTools.js'

// -------------------------------------------------------------------------------------------------
// Translation functions for organizations.
// !!! All these functions must have the same parameters structure : (metadata, path, ...args) !!!
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
      throw new RudiError(err)
    }
  }
  return result.substring(0, result.length - 2)
}

// -------------------------------------------------------------------------------------------------
// Fields Translators for organizations
// -------------------------------------------------------------------------------------------------

const argsGmdOrgs = PATHS_GMD_TO_RUDI[API_DATA_PRODUCER_PROPERTY].args

export const fieldTranslatorsOrgsGmdXml = [
  new FieldTranslator(API_ORGANIZATION_NAME, translateStraightFromPath, {
    path: argsGmdOrgs[API_ORGANIZATION_NAME].path,
    args: argsGmdOrgs[API_ORGANIZATION_NAME].args,
  }),
  new FieldTranslator(API_ORGANIZATION_ADDRESS, translateOrgAddress, {
    path: argsGmdOrgs[API_ORGANIZATION_ADDRESS].path,
    args: argsGmdOrgs[API_ORGANIZATION_ADDRESS].args,
  }),
]
