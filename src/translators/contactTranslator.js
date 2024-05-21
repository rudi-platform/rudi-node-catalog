const mod = 'contTrsltr'

// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import { parseStringPromise as xml2jsonParser } from 'xml2js'
import { findFirstElementWithPath, getElementWithPath } from './genericTranslationFunctions.js'
// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import {
  FORMAT_XML,
  PATHS_GMD_TO_RUDI,
  STANDARD_GMD,
} from '../config/confTranslation/gmd/confGmdXml.js'
import { OBJ_CONTACTS } from '../config/constApi.js'
import {
  API_CONTACT_ID,
  API_CONTACT_MAIL,
  API_CONTACT_NAME,
  API_CONTACT_ROLE,
  API_DATA_CONTACTS_PROPERTY,
  API_ORGANIZATION_NAME,
} from '../db/dbFields.js'
import { getObject } from '../db/dbQueries.js'
import { RudiError } from '../utils/errors.js'
import {
  getArgs,
  getPath,
  translateStraightFromPath,
  translateStraightFromXmlParam,
} from './genericTranslationFunctions.js'
import { FieldTranslator, ObjectTranslator } from './genericTranslator.js'

// -------------------------------------------------------------------------------------------------
// Translation functions for contacts.
// !!! All these functions must have the same parameters structure : (inputObject, path, ...args) !!!
// -------------------------------------------------------------------------------------------------

/**
 * Tries to fetch contact_id in Rudi Db from the id field in gmd, and then from the contact name.
 * @param {*} inputObject
 * @param {*} path
 * @param {*} args
 * @returns rudi_id matching with contact_name if a match is found, else undefined
 */
const translateContactId = async (inputObject, path, args) => {
  const fun = 'translateContactId'
  let result
  try {
    const contactId = findFirstElementWithPath(inputObject, path)
    if (contactId === undefined) {
      const contactName = getElementWithPath(inputObject, args?.[API_CONTACT_NAME]?.path)
      const rudiObj = await getObject(OBJ_CONTACTS, { [API_CONTACT_NAME]: contactName }, false)
      result = rudiObj?.[API_CONTACT_ID]
    } else {
      result = contactId
    }
    return result
  } catch (e) {
    throw RudiError.treatError(mod, fun, e)
  }
}

// -------------------------------------------------------------------------------------------------
// Fields Translators for organizations
// -------------------------------------------------------------------------------------------------

const argsContGmdXml = getArgs(PATHS_GMD_TO_RUDI, API_DATA_CONTACTS_PROPERTY)

export const GmdXmlToRudiContactTranslator = new ObjectTranslator(
  API_DATA_CONTACTS_PROPERTY,
  STANDARD_GMD,
  FORMAT_XML,
  true,
  [],
  argsContGmdXml,
  [
    new FieldTranslator(
      API_CONTACT_ID,
      translateContactId,
      true,
      getPath(argsContGmdXml, API_CONTACT_ID),
      argsContGmdXml
    ),
    new FieldTranslator(
      API_CONTACT_NAME,
      translateStraightFromPath,
      true,
      getPath(argsContGmdXml, API_CONTACT_NAME)
    ),
    new FieldTranslator(
      API_ORGANIZATION_NAME,
      translateStraightFromPath,
      false,
      getPath(argsContGmdXml, API_ORGANIZATION_NAME)
    ),
    new FieldTranslator(
      API_CONTACT_ROLE,
      translateStraightFromXmlParam,
      false,
      getPath(argsContGmdXml, API_CONTACT_ROLE),
      getArgs(argsContGmdXml, API_CONTACT_ROLE)
    ),
    new FieldTranslator(
      API_CONTACT_MAIL,
      translateStraightFromPath,
      true,
      getPath(argsContGmdXml, API_CONTACT_MAIL)
    ),
  ],
  xml2jsonParser
)
