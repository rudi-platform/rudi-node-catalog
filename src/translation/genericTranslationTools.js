const mod = 'translationTools'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import {
  FORMAT_XML,
  STANDARD_DCAT,
  STANDARD_GMD,
} from '../config/confTranslation/GMD_XML/confGMDXML.js'
import { OBJ_CONTACTS, OBJ_METADATA, OBJ_ORGANIZATIONS } from '../config/constApi.js'
import { GmdXmlToRudiContactTranslator } from './GMD_XML/contactTranslator.js'
import { GmdXmlToRudiMetadataTranslator } from './GMD_XML/metadataTranslator.js'
import { GmdXmlToRudiOrgaTranslator } from './GMD_XML/organizationTranslator.js'

// -------------------------------------------------------------------------------------------------
// Constants used in translation, i.e. translators objects.
// -------------------------------------------------------------------------------------------------

// list of all translators
const OBJECT_TRANSLATOR = {
  [OBJ_METADATA]: {
    [STANDARD_DCAT]: [],
    [STANDARD_GMD]: { [FORMAT_XML]: GmdXmlToRudiMetadataTranslator },
  },
  [OBJ_CONTACTS]: {
    [STANDARD_DCAT]: [],
    [STANDARD_GMD]: { [FORMAT_XML]: GmdXmlToRudiContactTranslator },
  },
  [OBJ_ORGANIZATIONS]: {
    [STANDARD_DCAT]: [],
    [STANDARD_GMD]: { [FORMAT_XML]: GmdXmlToRudiOrgaTranslator },
  },
}

// -------------------------------------------------------------------------------------------------
// Tools for translation of rudi objects
// -------------------------------------------------------------------------------------------------

/**
 * Checks if a translator is available for these parameters
 * @param {String} objectType the type of the object we want to get after the translation (ex: resource)
 * @param {String} objectStandard the standard of the inputObject (ex: dcat, gmd)
 * @param {String} objectFormat the format of the inputObject (ex: xml)
 * @returns returns undefined if no translator is available, else the translator
 */
export const getTranslator = (objectType, objectStandard, objectFormat) =>
  OBJECT_TRANSLATOR?.[objectType]?.[objectStandard]?.[objectFormat]
