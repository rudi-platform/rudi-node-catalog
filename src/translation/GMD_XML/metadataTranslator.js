const mod = 'metadataTrslat'
// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import { v4 as UUIDv4 } from 'uuid'
import { parseStringPromise as xml2jsonParser } from 'xml2js'

// -------------------------------------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------------------------------------
import {
  API_ACCESS_CONDITION,
  API_COLLECTION_TAG,
  API_DATA_CONTACTS_PROPERTY,
  API_DATA_DATES_PROPERTY,
  API_DATA_DESCRIPTION_PROPERTY,
  API_DATA_DETAILS_PROPERTY,
  API_DATA_NAME_PROPERTY,
  API_DATA_PRODUCER_PROPERTY,
  API_DATES_CREATED,
  API_DATES_EDITED,
  API_GEOGRAPHY,
  API_KEYWORDS_PROPERTY,
  API_LANGUAGES_PROPERTY,
  API_LICENCE,
  API_LICENCE_LABEL,
  API_LICENCE_TYPE,
  API_MEDIA_PROPERTY,
  API_METADATA_ID,
  API_METADATA_LOCAL_ID,
  API_METAINFO_CONTACTS_PROPERTY,
  API_METAINFO_PROPERTY,
  API_METAINFO_SOURCE_PROPERTY,
  API_METAINFO_VERSION_PROPERTY,
  API_STORAGE_STATUS,
  API_THEME_PROPERTY,
  DICT_LANG,
  DICT_TEXT,
  LicenceTypes,
} from '../../db/dbFields.js'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import {
  DICT_LANGUAGES_TO_RUDI,
  FORMAT_XML,
  PATHS_GMD_TO_RUDI,
  STANDARD_GMD,
} from '../../config/confTranslation/GMD_XML/confGMDXML.js'
import { API_VERSION, OBJ_METADATA } from '../../config/constApi.js'
import { getLicenceLabels } from '../../controllers/licenceController.js'
import { getObject } from '../../db/dbQueries.js'
import { get as getLanguages } from '../../definitions/thesaurus/Languages.js'
import { StorageStatus } from '../../definitions/thesaurus/StorageStatus.js'
import { BadRequestError, RudiError } from '../../utils/errors.js'
import { beautify, filterOnValue } from '../../utils/jsUtils.js'
import { logI } from '../../utils/logging.js'
import { FieldTranslator, ObjectTranslator } from '../translators.js'
import { GmdXmlToRudiContactTranslator } from './contactTranslator.js'
import {
  arrayCheck,
  createCustomLicence,
  findXmlParam,
  getArgs,
  getElementWithPath,
  getFirstElementWithPath,
  getPath,
  getXmlParam,
  translateStraightFromPath,
  translateStraightFromXmlParam,
} from './genericTranslationFunctions.js'
import { GmdXmlToRudiGeoTranslator } from './geographyTranslator.js'
import { GmdXmlToRudiMediaTranslator } from './mediaTranslator.js'
import { GmdXmlToRudiOrgaTranslator } from './organizationTranslator.js'

// -------------------------------------------------------------------------------------------------
// Translation functions for metadata.
// !!! All these functions must be async and have the same parameters structure : (inputObject, path, ...args) !!!
// -------------------------------------------------------------------------------------------------

/**
 * Translates rudi field 'summary' from xml gmd.
 * @param {Object} inputObject
 * @param {Array[String]} path
 * @param {*} args
 * @returns
 */
const translateSummary = async (inputObject, path, args) => {
  const fun = 'translateSummary'
  let result = {}
  try {
    const Languages = getLanguages()
    const text = getFirstElementWithPath(inputObject, path)
    const path_lang = getPath(args, API_LANGUAGES_PROPERTY)
    const param_lang = getArgs(args, API_LANGUAGES_PROPERTY).paramName
    const lang = getXmlParam(inputObject, path_lang, param_lang)
    let dictLang
    if (Languages.hasOwnProperty(lang)) {
      dictLang = lang
    } else if (DICT_LANGUAGES_TO_RUDI.hasOwnProperty(lang)) {
      dictLang = DICT_LANGUAGES_TO_RUDI?.[lang]
    } else {
      throw new BadRequestError(`Language '${lang}' is not recognized for import.`, mod, fun)
    }
    result[DICT_LANG] = dictLang
    result[DICT_TEXT] = text
    return [result]
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

/**
 * Translates rudi field 'synopsis' from xml gmd.
 * @param {Object} inputObject
 * @param {Array[String]} path
 * @param {*} args
 * @returns
 */
const translateSynopsis = async (inputObject, path, args) => {
  const fun = 'translateSynopsis'
  try {
    let result = arrayCheck(await translateSummary(inputObject, path, args))
    if (result[DICT_TEXT].length > 150) {
      result[DICT_TEXT] = result[DICT_TEXT].slice(0, 149)
    }
    return [result]
  } catch (e) {
    throw RudiError.treatError(mod, fun, e)
  }
}

// TODO : deal with external theme that are not recognized by RUDI
/**
 * Translates rudi field 'theme' from xml gmd. Takes the first theme.
 * @param {Object} inputObject
 * @param {Array[String]} path
 * @param {*} args
 * @returns
 */
const translateTheme = (inputObject, path, args) => {
  const fun = 'translateTheme'
  let result
  try {
    let rawThemes = getElementWithPath(inputObject, path)
    const relativePathKeyword = args.relativePathKeyword
    const relativePathCondition = args.relativePathCondition
    const relativePathCharacter = args.relativePathCharacter
    const paramCondition = args.paramCondition
    const paramExpectedValue = args.paramExpectedValue
    let themes = []
    for (const elem of rawThemes) {
      let paramValue = findXmlParam(elem, relativePathCondition, paramCondition)
      if (paramValue === paramExpectedValue) {
        let elemThemes = getElementWithPath(elem, relativePathKeyword)
        for (const elemTheme of elemThemes) {
          let newTheme = getFirstElementWithPath(elemTheme, relativePathCharacter)
          themes.push(newTheme)
        }
      }
    }
    if (themes.length === 0) {
      throw new BadRequestError(`No theme was found in origin Metadata`, mod, fun)
    } else {
      result = themes[0]
    }
    return result
  } catch (e) {
    throw RudiError.treatError(mod, fun, e)
  }
}

/**
 * Translates rudi field 'keywords' from xml gmd.
 * @param {Object} inputObject
 * @param {Array[String]} path
 * @param {*} args
 * @returns
 */
const translateKeywords = (inputObject, path, args) => {
  const fun = 'translateKeywords'
  let result
  try {
    let originKeywords = getElementWithPath(inputObject, path)
    const relativePathKeyword = args.relativePathKeyword
    const relativePathCharacter = args.relativePathCharacter
    let keywords = []
    for (const elem of originKeywords) {
      const elemKeywords = getElementWithPath(elem, relativePathKeyword)
      for (const elemKeyword of elemKeywords) {
        keywords = keywords.concat(getFirstElementWithPath(elemKeyword, relativePathCharacter))
      }
      if (keywords.length === 0) {
        throw new BadRequestError(`No keyword was found in origin Metadata`, mod, fun)
      } else {
        result = keywords
      }
    }
    return result
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

/**
 * Translates rudi field 'contacts' from xml gmd. Gives all contacts.
 * @param {Object} inputObject
 * @param {Array[String]} path
 * @param {*} args
 * @returns
 */
const translateContacts = async (inputObject, path, args) => {
  const fun = 'translateContacts'
  let result = []
  try {
    let relativePathCondition = args.relativePathCondition
    let paramCondition = args.paramCondition
    let paramExpectedValue = args.paramExpectedValue

    let allPotentialContacts = getElementWithPath(inputObject, path)
    let allContacts = []

    allPotentialContacts.map((contact) => {
      let paramValue = findXmlParam(contact, relativePathCondition, paramCondition)
      if (paramValue === paramExpectedValue) {
        allContacts.push(contact)
      }
    })

    if (allContacts.length === 0) {
      throw new BadRequestError(
        `No valid contact was found. Reminder : a valid contact in xml-gmd must have '${args.paramCondition}' set to '${args.paramExpectedValue}'`,
        mod,
        fun
      )
    }
    await Promise.all(
      allContacts.map((newContact) =>
        GmdXmlToRudiContactTranslator.translateInputObject(newContact).then((value) => {
          result.push(value)
        })
      )
    )
    return result
  } catch (e) {
    throw RudiError.treatError(mod, fun, e)
  }
}

/**
 * Translates rudi field 'available_formats' from xml gmd.
 * @param {Object} inputObject
 * @param {Array[String]} path
 * @param {*} args
 * @returns
 */
const translateAvailableFormats = async (inputObject, path) => {
  const fun = 'translateAvailableFormats'

  let result = []
  try {
    const mediaList = getElementWithPath(inputObject, path)

    await Promise.all(
      mediaList.map((media) => translateOneMedia(media).then((value) => result.push(value)))
    )
    if (result.length === 0) {
      throw new BadRequestError(
        `No Media was found in the metada, can't fill the rudi field ${API_MEDIA_PROPERTY}.`,
        mod,
        fun
      )
    }

    // Deprecated : used to keep track of source metadata, replace by metadata_source field.
    // const mediaURLOldMetadata = getFirstElementWithPath(inputObject, args.pathToSourceMetadata)
    // const mediaId = await findMediaIdWithURL(mediaURLOldMetadata)
    // let customMediaService = {
    //   [API_MEDIA_ID]: mediaId,
    //   [API_MEDIA_TYPE]: MediaTypes.Service,
    //   [API_MEDIA_NAME]: 'Link to source metadata',
    //   [API_MEDIA_CAPTION]:
    //     'Link to the metadata that was translated in RUDI format. Contains more informations.',
    //   [API_MEDIA_CONNECTOR]: { [API_PUB_URL]: mediaURLOldMetadata },
    // }
    // result.push(customMediaService)
    return result
  } catch (e) {
    throw RudiError.treatError(mod, fun, e)
  }
}

/**
 * Translates rudi field 'data_dates' from xml gmd.
 * @param {Object} inputObject
 * @param {Array[String]} path
 * @param {*} args
 * @returns
 */

const translateDataDates = (inputObject, path, args) => {
  const fun = 'translateDataDates'
  const result = {}
  try {
    const argsCreated = getArgs(args, API_DATES_CREATED)
    const argsEdited = getArgs(args, API_DATES_EDITED)
    const pathCreated = getPath(args, API_DATES_CREATED)
    const pathEdited = getPath(args, API_DATES_EDITED)
    const datesList = getElementWithPath(inputObject, path)
    for (const date of datesList) {
      const paramValueCreated = arrayCheck(
        findXmlParam(date, argsCreated.relativePathCondition, argsCreated.paramCondition)
      )
      const paramValueEdited = arrayCheck(
        findXmlParam(date, argsEdited.relativePathCondition, argsEdited.paramCondition)
      )

      if (paramValueCreated !== undefined && paramValueCreated === argsCreated.paramExpectedValue) {
        result[API_DATES_CREATED] = getFirstElementWithPath(date, pathCreated)
      }

      if (paramValueEdited !== undefined && paramValueEdited === argsEdited.paramExpectedValue) {
        result[API_DATES_EDITED] = getFirstElementWithPath(date, pathEdited)
      }
    }
    if (!(API_DATES_CREATED in result)) {
      throw new BadRequestError(`Rudi field ${API_DATES_CREATED} can not be filled.`, mod, fun)
    }
    if (!(API_DATES_EDITED in result)) {
      throw new BadRequestError(`Rudi field ${API_DATES_EDITED} can not be filled.`, mod, fun)
    }
    return result
  } catch (e) {
    throw RudiError.treatError(mod, fun, e)
  }
}

/**
 * Translates rudi field 'access_condition' from xml gmd. Tries to match a licence from RUDI.
 * @param {Object} inputObject
 * @param {Array[String]} path
 * @param {*} args
 * @returns
 */
const translateAccessCondition = async (inputObject, path, args) => {
  const fun = 'translateAccessCondition'
  let result = {}
  try {
    const inputLicence = getFirstElementWithPath(inputObject, path)
    const licence = await translateLicence(
      inputLicence,
      getPath(args, API_LICENCE),
      getArgs(args, API_LICENCE)
    )
    result[API_LICENCE] = licence
    return result
  } catch (e) {
    throw RudiError.treatError(mod, fun, e)
  }
}

/**
 * Translates rudi 'licence' from xml gmd. Tries to match with existing licence label. If no matching licence label is found, creates a custom licence.
 * @param {Object} inputObject
 * @param {Array[String]} path
 * @param {*} args
 * @returns
 */
const translateLicence = async (inputObject, path, args) => {
  const fun = 'translateLicence'
  let result = {}
  try {
    let relativePathCharacter = args.relativePathCharacter
    const objLicenceLabel = getElementWithPath(inputObject, path)
    let labelsLicences = await getLicenceLabels()

    let arrayCorrespondingRudiLicenceCode
    if (Array.isArray(objLicenceLabel)) {
      let promiseResult = await Promise.all(
        objLicenceLabel.map((objLicenceCode) => {
          let licenceCode = getFirstElementWithPath(objLicenceCode, relativePathCharacter)
          return filterOnValue(labelsLicences, (elem) => elem.includes(licenceCode))
        })
      )
      arrayCorrespondingRudiLicenceCode = promiseResult.filter((obj) => Object.keys(obj).length > 0)
    } else {
      let licenceCode = getFirstElementWithPath(objLicenceLabel, relativePathCharacter)
      arrayCorrespondingRudiLicenceCode = Array(
        await filterOnValue(labelsLicences, (elem) => elem.includes(licenceCode))
      ).filter((obj) => Object.keys(obj).length > 0)
    }

    let correspondingRudiLicenceCode
    if (arrayCorrespondingRudiLicenceCode.length === 0) {
      let pathToDefaultLabel = path.concat(relativePathCharacter)
      let defaultLabel = getFirstElementWithPath(inputObject, pathToDefaultLabel)
      logI(mod, fun, 'No corresponding Rudi Licence was found. Custom licence is created.')
      return createCustomLicence(defaultLabel)
    } else if (arrayCorrespondingRudiLicenceCode.length === 1) {
      correspondingRudiLicenceCode = Object.keys(arrayCorrespondingRudiLicenceCode[0])
    } else if (arrayCorrespondingRudiLicenceCode.length > 1) {
      correspondingRudiLicenceCode = Object.keys(arrayCorrespondingRudiLicenceCode[0])
      logI(
        mod,
        fun,
        `Several corresponding Rudi Licences were found : ${beautify(arrayCorrespondingRudiLicenceCode)}. First is taken.`
      )
    }
    result[API_LICENCE_TYPE] = LicenceTypes.Standard
    result[API_LICENCE_LABEL] = correspondingRudiLicenceCode[0]
    return result
  } catch (e) {
    throw RudiError.treatError(mod, fun, e)
  }
}

/**
 * Translates rudi field 'global_id' from xml gmd. Tries to find existing global_id with matching field 'local_id'. If no matching 'local_id' is found, returns undefined.
 * @param {Object} inputObject
 * @param {Array[String]} path
 * @param {*} args
 * @returns global_id corresponding to field local_id if an existing metadata with this local_id is found. Else returns undefined.
 */
export const translateGlobalId = async (inputObject, path, args) => {
  const fun = 'translateGlobalId'
  let result
  try {
    const localId = getFirstElementWithPath(inputObject, args)
    const objectInRudiDb = await getObject(
      OBJ_METADATA,
      { [API_METADATA_LOCAL_ID]: localId },
      false
    )
    result = objectInRudiDb?.[API_METADATA_ID]
    if (result == undefined) {
      result = UUIDv4()
      logI(mod, fun, `No matching 'local_id' was found; new UUIDv4 was created for metadata.`)
    } else {
      logI(mod, fun, `Matching 'local_id' was found in RUDI database.`)
    }
    return result
  } catch (e) {
    throw RudiError.treatError(mod, fun, e)
  }
}

/**
 * Translates rudi field 'producer' from xml gmd. Uses Translator Object GmdXmlToRudiOrgaTranslator.
 * @param {Object} inputObject
 * @param {Array[String]} path
 * @param {*} args
 * @returns organization at rudi format.
 */
export const translateOrganization = async (inputObject, path, args) => {
  const fun = 'translateOrganization'
  try {
    const allContacts = getElementWithPath(inputObject, path)
    const relativePathCondition = args?.relativePathCondition
    const paramCondition = args?.paramCondition
    const paramExpectedValue = args?.paramExpectedValue
    const allOrgs = []
    allContacts.forEach((element) => {
      const xmlParamValue = getXmlParam(element, relativePathCondition, paramCondition)
      if (xmlParamValue === paramExpectedValue) {
        allOrgs.push(element)
      }
    })

    if (allOrgs.length === 0) {
      throw new BadRequestError(
        `No organization was found. Reminder, a valid xml-gmd org must have a tag '${paramCondition}' with value ${paramExpectedValue}.`,
        mod,
        fun
      )
    } else {
      return await GmdXmlToRudiOrgaTranslator.translateInputObject(allOrgs[0])
    }
  } catch (e) {
    throw RudiError.treatError(mod, fun, e)
  }
}

/**
 * Translates one Media from xml gmd. Uses Translator object GmdXmlToRudiMediaTranslator.
 * @param {Object} inputObject
 * @param {Array[String]} path
 * @param {*} args
 * @returns a Rudi Media
 */
const translateOneMedia = async (inputObject) => {
  const fun = 'translateOneMedia'
  try {
    return await GmdXmlToRudiMediaTranslator.translateInputObject(inputObject)
  } catch (e) {
    throw RudiError.treatError(mod, fun, e)
  }
}

// -------------------------------------------------------------------------------------------------
// Metadata Translator Objects
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
      API_METADATA_ID,
      translateGlobalId,
      true,
      [],
      getPath(PATHS_GMD_TO_RUDI, API_METADATA_LOCAL_ID)
    ),
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
    new FieldTranslator(
      API_DATA_PRODUCER_PROPERTY,
      translateOrganization,
      true,
      getPath(PATHS_GMD_TO_RUDI, API_DATA_PRODUCER_PROPERTY),
      getArgs(PATHS_GMD_TO_RUDI, API_DATA_PRODUCER_PROPERTY)
    ),
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
    new FieldTranslator(
      API_GEOGRAPHY,
      (inputObject) => GmdXmlToRudiGeoTranslator.translateInputObject(inputObject),
      false
    ),
    new FieldTranslator(
      API_METAINFO_PROPERTY,
      (inputObject) => GmdXmlToRudiMetaInfoTranslator.translateInputObject(inputObject),
      true
    ),
    new FieldTranslator(API_STORAGE_STATUS, () => StorageStatus.Online, true),
    new FieldTranslator(
      API_COLLECTION_TAG,
      translateStraightFromXmlParam,
      false,
      getPath(PATHS_GMD_TO_RUDI, API_COLLECTION_TAG),
      getArgs(PATHS_GMD_TO_RUDI, API_COLLECTION_TAG)
    ),
  ],
  xml2jsonParser
)

const GmdXmlToRudiMetaInfoTranslator = new ObjectTranslator(
  API_METAINFO_PROPERTY,
  STANDARD_GMD,
  FORMAT_XML,
  true,
  [],
  {},
  [
    new FieldTranslator(API_METAINFO_VERSION_PROPERTY, () => API_VERSION, true),
    new FieldTranslator(
      API_METAINFO_CONTACTS_PROPERTY,
      translateContacts,
      true,
      getPath(PATHS_GMD_TO_RUDI, API_METAINFO_CONTACTS_PROPERTY),
      getArgs(PATHS_GMD_TO_RUDI, API_METAINFO_CONTACTS_PROPERTY)
    ),
    new FieldTranslator(
      API_METAINFO_SOURCE_PROPERTY,
      translateStraightFromPath,
      true,
      getArgs(PATHS_GMD_TO_RUDI, API_MEDIA_PROPERTY).pathToSourceMetadata
    ),
  ]
)
