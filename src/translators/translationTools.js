const mod = 'translationTools'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import {
  FORMAT_XML,
  STANDARD_DCAT,
  STANDARD_GMD,
} from '../config/confTranslation/gmd/confGmdXml.js'
import { OBJ_CONTACTS, OBJ_METADATA, OBJ_ORGANIZATIONS } from '../config/constApi.js'
import { NotImplementedError } from '../utils/errors.js'
import { fieldTranslatorsContactGmdXml } from './contactTranslator.js'
import { ObjectTranslator } from './genericTranslator.js'
import { fieldTranslatorsMetadataGmdXml } from './metadataTranslator.js'
import { fieldTranslatorsOrgsGmdXml } from './organizationTranslator.js'
// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------

import { parseStringPromise } from 'xml2js'

// -------------------------------------------------------------------------------------------------
// Constants used in translation
// -------------------------------------------------------------------------------------------------

// list of all translators
export const translatorObjects = {
  [OBJ_METADATA]: {
    [STANDARD_DCAT]: [],
    [STANDARD_GMD]: {
      [FORMAT_XML]: new ObjectTranslator(
        OBJ_METADATA,
        STANDARD_GMD,
        FORMAT_XML,
        fieldTranslatorsMetadataGmdXml,
        parseStringPromise
      ),
    },
  },
  [OBJ_CONTACTS]: {
    [STANDARD_DCAT]: [],
    [STANDARD_GMD]: {
      [FORMAT_XML]: new ObjectTranslator(
        OBJ_CONTACTS,
        STANDARD_GMD,
        FORMAT_XML,
        fieldTranslatorsContactGmdXml,
        parseStringPromise
      ),
    },
  },
  [OBJ_ORGANIZATIONS]: {
    [STANDARD_DCAT]: [],
    [STANDARD_GMD]: {
      [FORMAT_XML]: new ObjectTranslator(
        OBJ_ORGANIZATIONS,
        STANDARD_GMD,
        FORMAT_XML,
        fieldTranslatorsOrgsGmdXml,
        parseStringPromise
      ),
    },
  },
}

// -------------------------------------------------------------------------------------------------
// Generic tools for translation of rudi objects
// -------------------------------------------------------------------------------------------------

/**
 * Checks if a translator is available for these parameters
 * @param {String} objectType the type of the object we want to get after the translation (ex: resource)
 * @param {String} objectStandard the standard of the inputObject (ex: dcat, gmd)
 * @param {String} objectFormat the format of the inputObject (ex: xml)
 * @returns true if a translator is available, else false
 */
export const isTranslatable = (objectType, objectStandard, objectFormat) => {
  const availableTranslators = translatorObjects[objectType][objectStandard]
  return Object.keys(availableTranslators).includes(objectFormat)
}

/**
 * Use a translator (if available) to translate inputObject.
 * @param {String} inputObject the input Object, at string format (coming straigth from the request)
 * @param {String} objectType the type of the object we want to get after the translation (ex: resource)
 * @param {String} objectStandard the standard of the inputObject (ex: dcat, gmd)
 * @param {String} objectFormat the format of the inputObject (ex: xml)
 * @returns the corresponding json object in rudi standard
 */
export const translate = (object, objectType, objectStandard, objectFormat) => {
  if (!isTranslatable(objectType, objectStandard, objectFormat)) {
    throw new NotImplementedError(
      `Object of type ${objectType}, at standard ${objectStandard} and format ${objectFormat} can not yet be uploaded.`
    )
  }
  const translator = translatorObjects[objectType][objectStandard][objectFormat]
  return translator.translate(object, true)
}
