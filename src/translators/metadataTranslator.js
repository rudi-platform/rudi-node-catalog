const mod = 'metadataTrslat'
// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import { parseStringPromise as xml2jsonParser } from 'xml2js'

// -------------------------------------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------------------------------------
import {
  API_ACCESS_CONDITION,
  API_DATA_CONTACTS_PROPERTY,
  API_DATA_DATES_PROPERTY,
  API_DATA_DESCRIPTION_PROPERTY,
  API_DATA_DETAILS_PROPERTY,
  API_DATA_NAME_PROPERTY,
  API_DATES_CREATED,
  API_DATES_EDITED,
  API_KEYWORDS_PROPERTY,
  API_LANGUAGES_PROPERTY,
  API_LICENCE,
  API_LICENCE_CUSTOM_LABEL,
  API_LICENCE_CUSTOM_URI,
  API_LICENCE_LABEL,
  API_LICENCE_TYPE,
  API_MEDIA_PROPERTY,
  API_METADATA_LOCAL_ID,
  API_THEME_PROPERTY,
  DICT_LANG,
  DICT_TEXT,
  LicenceTypes,
} from '../db/dbFields.js'
import { logD } from '../utils/logging.js'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import {
  FORMAT_XML,
  PATHS_GMD_TO_RUDI,
  STANDARD_GMD,
} from '../config/confTranslation/gmd/confGmdXml.js'
import { OBJ_METADATA } from '../config/constApi.js'
import { getLicenceLabels } from '../controllers/licenceController.js'
import { BadRequestError, RudiError } from '../utils/errors.js'
import { beautify, filterOnValue, isEmpty } from '../utils/jsUtils.js'
import { logI } from '../utils/logging.js'
import { GmdXmlToRudiContactTranslator } from './contactTranslator.js'
import {
  arrayCheck,
  findXmlParam,
  getArgs,
  getElementWithPath,
  getFirstElementWithPath,
  getPath,
  getXmlParam,
  translateStraightFromPath,
} from './genericTranslationFunctions.js'
import { FieldTranslator, ObjectTranslator } from './genericTranslator.js'
import { GmdXmlToRudiGeoTranslator } from './geographyTranslator.js'
import { translateOneMedia } from './mediaTranslator.js'
import { GmdXmlToRudiOrgaTranslator } from './organizationTranslator.js'
// -------------------------------------------------------------------------------------------------
// Translation functions for metadata.
// !!! All these functions must have the same parameters structure : (metadata, path, ...args) !!!
// -------------------------------------------------------------------------------------------------

const translateSummary = async function (metadata, path, args) {
  const fun = 'translateSummary'
  let result = {}

  try {
    const text = await getFirstElementWithPath(metadata, path)
    const path_lang = getPath(args, API_LANGUAGES_PROPERTY)
    const param_lang = getArgs(args, API_LANGUAGES_PROPERTY).paramName
    const lang = await getXmlParam(metadata, path_lang, param_lang)
    result[DICT_LANG] = lang
    result[DICT_TEXT] = text
    return result
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

const translateSynopsis = async function (metadata, path, args) {
  const fun = 'translateSynopsis'
  let result = await translateSummary(metadata, path, args)
  if (result[DICT_TEXT].length > 150) {
    result[DICT_TEXT] = result[DICT_TEXT].substring(0, 149)
  }
  return result
}

const translateTheme = async function (metadata, path, args) {
  const fun = 'translateTheme'
  let result = await getElementWithPath(metadata, path)
  const relativePathKeyword = args.relativePathKeyword
  const relativePathCondition = args.relativePathCondition
  const relativePathCharacter = args.relativePathCharacter
  const paramCondition = args.paramCondition
  const paramExpectedValue = args.paramExpectedValue
  let themes = []

  for await (const elem of result) {
    let paramValue
    try {
      paramValue = await findXmlParam(elem, relativePathCondition, paramCondition)
    } catch (err) {
      throw RudiError.treatError(mod, fun, err)
    }
    if (paramValue === paramExpectedValue) {
      let elemThemes = await getElementWithPath(elem, relativePathKeyword)
      for await (const elemTheme of elemThemes) {
        let newTheme = arrayCheck(await getElementWithPath(elemTheme, relativePathCharacter))
        themes.push(newTheme)
      }
    }
  }
  if (themes.length === 0) {
    throw new BadRequestError(`No theme was found in origin Metadata`, mod, fun)
  } else {
    return themes[0]
  }
}

const translateKeywords = async function (metadata, path, args) {
  const fun = 'translateKeywords'
  let result = await getElementWithPath(metadata, path)
  const relativePathKeyword = args.relativePathKeyword
  const relativePathCharacter = args.relativePathCharacter
  let keywords = []
  for await (const elem of result) {
    try {
      const elemKeywords = await getElementWithPath(elem, relativePathKeyword)
      for await (const elemKeyword of elemKeywords) {
        keywords = keywords.concat(
          await getFirstElementWithPath(elemKeyword, relativePathCharacter)
        )
      }
    } catch (err) {
      throw RudiError.treatError(mod, fun, err)
    }
  }
  if (keywords.length === 0) {
    throw RudiError.treatError(mod, fun, `No keyword was found in origin Metadata`)
  } else {
    return keywords
  }
}

const translateContacts = async function (metadata, path, args) {
  const fun = 'translateContacts'

  let relativePathCondition = args.relativePathCondition
  let paramCondition = args.paramCondition
  let paramExpectedValue = args.paramExpectedValue

  let allPotentialContacts = await getElementWithPath(metadata, path)

  let allContacts = []
  try {
    for await (const contact of allPotentialContacts) {
      let paramValue = await findXmlParam(contact, relativePathCondition, paramCondition)
      if (paramValue === paramExpectedValue) {
        allContacts.push(contact)
      }
    }
  } catch (e) {
    throw RudiError.treatError(mod, fun, e)
  }
  if (allContacts.length === 0) {
    throw new BadRequestError(
      `No valid contact was found. Reminder : a valid contact must have ${args.paramCondition} set to ${args.paramExpectedValue}`,
      mod,
      fun
    )
  }

  let result = []
  try {
    for await (const newContact of allContacts) {
      let translatedContact = await GmdXmlToRudiContactTranslator.translateInputObject(newContact)
      result.push(translatedContact)
    }
  } catch (e) {
    throw RudiError.treatError(mod, fun, e)
  }
  return result
}

const translateAvailableFormats = async (metadata, path, args) => {
  const fun = 'translateAvailableFormats'

  let result = []
  try {
    const mediaList = await getElementWithPath(metadata, path)
    for await (const media of mediaList) {
      result.push(await translateOneMedia(media))
    }
  } catch (e) {
    throw RudiError.treatError(mod, fun, e)
  }

  if (result.length === 0) {
    throw new BadRequestError(
      `No Media was found in the metada, can't fill the rudi field ${API_MEDIA_PROPERTY}.`,
      mod,
      fun
    )
  }
  return result
}

const translateDataDates = async (metadata, path, args) => {
  const fun = 'translateDataDates'
  logD(mod, fun, beautify(args))
  const argsCreated = getArgs(args, API_DATES_CREATED)
  const argsEdited = getArgs(args, API_DATES_EDITED)
  const pathCreated = getPath(args, API_DATES_CREATED)
  const pathEdited = getPath(args, API_DATES_EDITED)
  let result = {}
  try {
    const datesList = await getElementWithPath(metadata, path)
    for await (const date of datesList) {
      let paramValueCreated = arrayCheck(
        await findXmlParam(date, argsCreated.relativePathCondition, argsCreated.paramCondition)
      )
      let paramValueEdited = arrayCheck(
        await findXmlParam(date, argsEdited.relativePathCondition, argsEdited.paramCondition)
      )

      if (paramValueCreated !== undefined && paramValueCreated === argsCreated.paramExpectedValue) {
        result[API_DATES_CREATED] = await getFirstElementWithPath(date, pathCreated)
      }

      if (paramValueEdited !== undefined && paramValueEdited === argsEdited.paramExpectedValue) {
        result[API_DATES_EDITED] = await getFirstElementWithPath(date, pathEdited)
      }
    }
  } catch (e) {
    throw RudiError.treatError(mod, fun, e)
  }
  if (!(API_DATES_CREATED in result)) {
    throw new BadRequestError(`Rudi field ${API_DATES_CREATED} can not be filled !`, mod, fun)
  }
  if (!(API_DATES_EDITED in result)) {
    throw new BadRequestError(`Rudi field ${API_DATES_EDITED} can not be filled !`, mod, fun)
  }
  return result
}

const translateAccessCondition = async function (metadata, path, args) {
  const fun = 'translateAccessCondition'

  let result = {}
  try {
    const inputObject = await getFirstElementWithPath(metadata, path)
    const licence = await translateLicence(
      inputObject,
      getPath(args, API_LICENCE),
      getArgs(args, API_LICENCE)
    )
    result[API_LICENCE] = licence
    return result
  } catch (e) {
    throw RudiError.treatError(mod, fun, e)
  }
}

const translateLicence = async function (inputObject, path, args) {
  const fun = 'translateLicence'
  let relativePathCharacter = args.relativePathCharacter
  let result = {}
  try {
    const objLicenceLabel = await getElementWithPath(inputObject, path)
    let labelsLicences = await getLicenceLabels()

    let correspondingRudiLicenceCode = []
    for await (const objLicenceCode of objLicenceLabel) {
      let licenceCode = await getFirstElementWithPath(objLicenceCode, relativePathCharacter)
      let result = await filterOnValue(labelsLicences, (elem) => {
        return elem.includes(licenceCode)
      }) // object with keys: Rudi Licence Codes that have licence labels in inputObject and values: corresponding labels for this Rudi Licence
      if (!isEmpty(result)) {
        correspondingRudiLicenceCode = correspondingRudiLicenceCode.concat(Object.keys(result))
      }
    }
    // logD(mod, fun, beautify(correspondingRudiLicenceCode))
    if (correspondingRudiLicenceCode.length === 0) {
      let pathToDefaultLabel = path.concat(relativePathCharacter)
      let defaultLabel = await getFirstElementWithPath(inputObject, pathToDefaultLabel)
      logI(mod, fun, 'No corresponding Rudi Licence was found.')
      return createCustomLicence(defaultLabel)
    } else if (correspondingRudiLicenceCode.length > 1) {
      logI(
        mod,
        fun,
        `Several corresponding Rudi Licences were found : ${beautify(correspondingRudiLicenceCode)}. First is taken.`
      )
    }
    result[API_LICENCE_TYPE] = LicenceTypes.Standard
    result[API_LICENCE_LABEL] = correspondingRudiLicenceCode[0]
    return result
  } catch (e) {
    throw RudiError.treatError(mod, fun, e)
  }
}

// const translateGeography = async function (inputObject, path, args) {
//   let geoTranslator = new FieldTranslator(
//     API_GEOGRAPHY,
//     STANDARD_GMD,
//     FORMAT_XML,
//     fieldTranslatorsGeoGmdXml
//   )
//   try {
//     let geoObject = await getFirstElementWithPath(inputObject, path)
//     return await geoTranslator.translate(geoObject)
//   } catch (e) {
//     throw RudiError.treatError(e)
//   }
// }
// -------------------------------------------------------------------------------------------------
// FieldTranslators from gmd-xml metadata to rudi.
// -------------------------------------------------------------------------------------------------

export const GmdXmlToRudiMetadataTranslator = new ObjectTranslator(
  OBJ_METADATA,
  STANDARD_GMD,
  FORMAT_XML,
  true,
  [],
  {},
  [
    new FieldTranslator(
      API_METADATA_LOCAL_ID,
      translateStraightFromPath,
      true,
      getPath(PATHS_GMD_TO_RUDI, API_METADATA_LOCAL_ID)
    ),
    new FieldTranslator(
      API_DATA_NAME_PROPERTY,
      translateStraightFromPath,
      true,
      getPath(PATHS_GMD_TO_RUDI, API_DATA_NAME_PROPERTY)
    ),
    new FieldTranslator(
      API_DATA_DETAILS_PROPERTY,
      translateSynopsis,
      true,
      getPath(PATHS_GMD_TO_RUDI, API_DATA_DESCRIPTION_PROPERTY),
      {
        [API_LANGUAGES_PROPERTY]: {
          path: getPath(PATHS_GMD_TO_RUDI, API_LANGUAGES_PROPERTY),
          args: getArgs(PATHS_GMD_TO_RUDI, API_LANGUAGES_PROPERTY),
        },
      }
    ),
    new FieldTranslator(
      API_DATA_DESCRIPTION_PROPERTY,
      translateSummary,
      true,
      getPath(PATHS_GMD_TO_RUDI, API_DATA_DESCRIPTION_PROPERTY),
      {
        [API_LANGUAGES_PROPERTY]: {
          path: getPath(PATHS_GMD_TO_RUDI, API_LANGUAGES_PROPERTY),
          args: getArgs(PATHS_GMD_TO_RUDI, API_LANGUAGES_PROPERTY),
        },
      }
    ),
    new FieldTranslator(
      API_THEME_PROPERTY,
      translateTheme,
      true,
      getPath(PATHS_GMD_TO_RUDI, API_THEME_PROPERTY),
      getArgs(PATHS_GMD_TO_RUDI, API_THEME_PROPERTY)
    ),
    new FieldTranslator(
      API_KEYWORDS_PROPERTY,
      translateKeywords,
      true,
      getPath(PATHS_GMD_TO_RUDI, API_THEME_PROPERTY),
      getArgs(PATHS_GMD_TO_RUDI, API_THEME_PROPERTY)
    ),
    GmdXmlToRudiOrgaTranslator,
    new FieldTranslator(
      API_DATA_CONTACTS_PROPERTY,
      translateContacts,
      true,
      getPath(PATHS_GMD_TO_RUDI, API_DATA_CONTACTS_PROPERTY),
      getArgs(PATHS_GMD_TO_RUDI, API_DATA_CONTACTS_PROPERTY)
    ),
    new FieldTranslator(
      API_MEDIA_PROPERTY,
      translateAvailableFormats,
      true,
      getPath(PATHS_GMD_TO_RUDI, API_MEDIA_PROPERTY),
      getArgs(PATHS_GMD_TO_RUDI, API_MEDIA_PROPERTY)
    ),
    new FieldTranslator(
      API_DATA_DATES_PROPERTY,
      translateDataDates,
      true,
      getPath(PATHS_GMD_TO_RUDI, API_DATA_DATES_PROPERTY),
      getArgs(PATHS_GMD_TO_RUDI, API_DATA_DATES_PROPERTY)
    ),
    new FieldTranslator(
      API_ACCESS_CONDITION,
      translateAccessCondition,
      true,
      getPath(PATHS_GMD_TO_RUDI, API_ACCESS_CONDITION),
      getArgs(PATHS_GMD_TO_RUDI, API_ACCESS_CONDITION)
    ),
    GmdXmlToRudiGeoTranslator,
  ],
  xml2jsonParser
)

// -------------------------------------------------------------------------------------------------
// Tools
// -------------------------------------------------------------------------------------------------
const createCustomLicence = function (label) {
  // const fun = 'createCustomLicence'
  let result = {
    [API_LICENCE_TYPE]: LicenceTypes.Custom,
    [API_LICENCE_CUSTOM_LABEL]: label,
    [API_LICENCE_CUSTOM_URI]: label, // !! no available custom URI ?
  }
  return result
}
