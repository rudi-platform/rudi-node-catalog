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
import { GmdXmlToRudiMetadataTranslator } from './metadataTranslator.js'

// -------------------------------------------------------------------------------------------------
// Constants used in translation
// -------------------------------------------------------------------------------------------------

// list of all translators
export const translatorObjects = {
  [OBJ_METADATA]: {
    [STANDARD_DCAT]: [],
    [STANDARD_GMD]: {
      [FORMAT_XML]: GmdXmlToRudiMetadataTranslator,
    },
  },
  [OBJ_CONTACTS]: {
    [STANDARD_DCAT]: [],
    [STANDARD_GMD]: {
      [FORMAT_XML]: {},
    },
  },
  [OBJ_ORGANIZATIONS]: {
    [STANDARD_DCAT]: [],
    [STANDARD_GMD]: {
      [FORMAT_XML]: {},
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
 * @returns return undefined if no translator is available, else the translator
 */
export const isTranslatable = (objectType, objectStandard, objectFormat) => {
  return translatorObjects?.[objectType]?.[objectStandard]?.[objectFormat]
}

// /**
//  * Use a translator (if available) to translate inputObject.
//  * @param {String} inputObject the input Object, at string format (coming straigth from the request)
//  * @param {String} objectType the type of the object we want to get after the translation (ex: resource)
//  * @param {String} objectStandard the standard of the inputObject (ex: dcat, gmd)
//  * @param {String} objectFormat the format of the inputObject (ex: xml)
//  * @returns the corresponding json object in rudi standard
//  */
// export const translateInputObject = (inputObject, objectType, objectStandard, objectFormat) => {
//   const fun = 'translate'
//   if (!isTranslatable(objectType, objectStandard, objectFormat)) {
//     throw new NotImplementedError(
//       `Object of type ${objectType}, at standard ${objectStandard} and format ${objectFormat} can not yet be uploaded.`
//     )
//   }
//   const translator = translatorObjects?.[objectType]?.[objectStandard]?.[objectFormat]
//   let result = translator.translate(inputObject, true)
//   logD(mod, fun, beautify(result))
//   return result
// }
