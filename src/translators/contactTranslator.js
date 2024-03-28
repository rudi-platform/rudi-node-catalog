const mod = 'contTrsltr'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { PATHS_GMD_TO_RUDI } from '../config/confTranslation/gmd/confGmdXml.js'
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
import { FieldTranslator } from './genericTranslator.js'

// -------------------------------------------------------------------------------------------------
// Translation functions for contacts.
// !!! All these functions must have the same parameters structure : (metadata, path, args) !!!
// -------------------------------------------------------------------------------------------------

// -------------------------------------------------------------------------------------------------
// Fields Translators for organizations
// -------------------------------------------------------------------------------------------------

const argsGmdContacts = PATHS_GMD_TO_RUDI[API_DATA_CONTACTS_PROPERTY].args

export const fieldTranslatorsContactGmdXml = [
  new FieldTranslator(API_CONTACT_NAME, translateStraightFromPath, {
    path: getPath(argsGmdContacts, API_CONTACT_NAME),
  }),
  new FieldTranslator(API_ORGANIZATION_NAME, translateStraightFromPath, {
    path: getPath(argsGmdContacts, API_ORGANIZATION_NAME),
  }),
  new FieldTranslator(API_CONTACT_ROLE, translateStraightFromXmlParam, {
    path: getPath(argsGmdContacts, API_CONTACT_ROLE),
    args: getArgs(argsGmdContacts, API_CONTACT_ROLE),
  }),
  new FieldTranslator(API_CONTACT_MAIL, translateStraightFromPath, {
    path: getPath(argsGmdContacts, API_CONTACT_MAIL),
  }),
]
