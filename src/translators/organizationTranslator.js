const mod = 'orgTrsltr'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { parseStringPromise as xml2jsonParser } from 'xml2js'
import {
  FORMAT_XML,
  PATHS_GMD_TO_RUDI,
  STANDARD_GMD,
} from '../config/confTranslation/gmd/confGmdXml.js'
import { OBJ_ORGANIZATIONS } from '../config/constApi.js'
import {
  API_DATA_PRODUCER_PROPERTY,
  API_ORGANIZATION_ADDRESS,
  API_ORGANIZATION_ID,
  API_ORGANIZATION_NAME,
} from '../db/dbFields.js'
import { getObject } from '../db/dbQueries.js'
import { BadRequestError, RudiError } from '../utils/errors.js'
import {
  findFirstElementWithPath,
  getArgs,
  getFirstElementWithPath,
  getPath,
  translateStraightFromPath,
} from './genericTranslationFunctions.js'
import { FieldTranslator, ObjectTranslator } from './genericTranslator.js'

// -------------------------------------------------------------------------------------------------
// Translation functions for organizations.
// !!! All these functions must have the same parameters structure : (inputObject, path, ...args) !!!
// -------------------------------------------------------------------------------------------------

const translateOrgAddress = async (inputObject, path, args) => {
  const fun = 'translateOrgAddress'
  try {
    let relativePathCharacter = args.relativePathCharacter
    let result = ''
    for (const elem of args.fieldsToConcat) {
      let addressField = getFirstElementWithPath(
        inputObject,
        path.concat([elem, relativePathCharacter])
      )
      result += addressField + ', '
    }
    return result.substring(0, result.length - 2)
  } catch (e) {
    throw RudiError.treatError(mod, fun, e)
  }
}

/**
 * Tries to fetch org_id in Rudi Db from the id field in gmd, and then from the organization name.
 * @param {*} inputObject
 * @param {*} path
 * @param {*} args
 * @returns rudi_id matching with organization_name if a match is found, else undefined
 */
const translateOrgId = async (inputObject, path, args) => {
  const fun = 'translateOrgId'
  let result
  try {
    const orgId = findFirstElementWithPath(inputObject, path)
    if (orgId === undefined) {
      const orgName = getFirstElementWithPath(inputObject, args?.[API_ORGANIZATION_NAME]?.path)
      const rudiObj = await getObject(
        OBJ_ORGANIZATIONS,
        { [API_ORGANIZATION_NAME]: orgName },
        false
      )
      result = rudiObj?.[API_ORGANIZATION_ID]
      if (result == undefined) {
        throw new BadRequestError(
          `No organization with name '${orgName}' was found in database. Please add it.`
        )
      }
    } else {
      result = orgId
    }
    return result
  } catch (e) {
    throw RudiError.treatError(mod, fun, e)
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
      API_ORGANIZATION_ID,
      translateOrgId,
      true,
      getPath(argsOrgGmdXml, API_ORGANIZATION_ID),
      argsOrgGmdXml
    ),
    new FieldTranslator(
      API_ORGANIZATION_NAME,
      translateStraightFromPath,
      true,
      getPath(argsOrgGmdXml, API_ORGANIZATION_NAME)
    ),
    new FieldTranslator(
      API_ORGANIZATION_ADDRESS,
      translateOrgAddress,
      false,
      getPath(argsOrgGmdXml, API_ORGANIZATION_ADDRESS),
      getArgs(argsOrgGmdXml, API_ORGANIZATION_ADDRESS)
    ),
  ],
  xml2jsonParser
)
