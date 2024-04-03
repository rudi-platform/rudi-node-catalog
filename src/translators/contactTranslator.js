const mod = 'contTrsltr'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import {
  FORMAT_XML,
  PATHS_GMD_TO_RUDI,
  STANDARD_GMD,
} from '../config/confTranslation/gmd/confGmdXml.js'
import {
  API_CONTACT_MAIL,
  API_CONTACT_NAME,
  API_CONTACT_ROLE,
  API_DATA_CONTACTS_PROPERTY,
  API_ORGANIZATION_NAME,
} from '../db/dbFields.js'
import {
  getArgs,
  getPath,
  translateStraightFromPath,
  translateStraightFromXmlParam,
} from './genericTranslationFunctions.js'
import { FieldTranslator, ObjectTranslator } from './genericTranslator.js'

// -------------------------------------------------------------------------------------------------
// Translation functions for contacts.
// !!! All these functions must have the same parameters structure : (inputObject, path, args) !!!
// -------------------------------------------------------------------------------------------------

// -------------------------------------------------------------------------------------------------
// Fields Translators for organizations
// -------------------------------------------------------------------------------------------------

// const pathContGmdXml = getPath(PATHS_GMD_TO_RUDI, API_DATA_CONTACTS_PROPERTY)
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
      API_CONTACT_NAME,
      translateStraightFromPath,
      false,
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
      false,
      getPath(argsContGmdXml, API_CONTACT_MAIL)
    ),
  ]
)
