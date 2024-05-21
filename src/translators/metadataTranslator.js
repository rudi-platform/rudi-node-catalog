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
  API_DATA_PRODUCER_PROPERTY,
  API_DATES_CREATED,
  API_DATES_EDITED,
  API_KEYWORDS_PROPERTY,
  API_LANGUAGES_PROPERTY,
  API_LICENCE,
  API_LICENCE_LABEL,
  API_LICENCE_TYPE,
  API_MEDIA_CAPTION,
  API_MEDIA_CONNECTOR,
  API_MEDIA_NAME,
  API_MEDIA_PROPERTY,
  API_MEDIA_TYPE,
  API_METADATA_ID,
  API_METADATA_LOCAL_ID,
  API_METAINFO_CONTACTS_PROPERTY,
  API_METAINFO_PROPERTY,
  API_METAINFO_SOURCE_PROPERTY,
  API_METAINFO_VERSION_PROPERTY,
  API_PUB_URL,
  API_THEME_PROPERTY,
  DICT_LANG,
  DICT_TEXT,
  LicenceTypes,
} from '../db/dbFields.js'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import {
  FORMAT_XML,
  PATHS_GMD_TO_RUDI,
  STANDARD_GMD,
} from '../config/confTranslation/gmd/confGmdXml.js'
import { API_VERSION, OBJ_METADATA } from '../config/constApi.js'
import { getLicenceLabels } from '../controllers/licenceController.js'
import { getObject } from '../db/dbQueries.js'
import { MediaTypes } from '../definitions/models/Media.js'
import { BadRequestError, RudiError } from '../utils/errors.js'
import { beautify, filterOnValue, isEmpty } from '../utils/jsUtils.js'
import { logI } from '../utils/logging.js'
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
} from './genericTranslationFunctions.js'
import { FieldTranslator, ObjectTranslator } from './genericTranslator.js'
import { GmdXmlToRudiGeoTranslator } from './geographyTranslator.js'
import { translateOneMedia } from './mediaTranslator.js'
import { GmdXmlToRudiOrgaTranslator } from './organizationTranslator.js'

// -------------------------------------------------------------------------------------------------
// Translation functions for metadata.
// !!! All these functions must be async and have the same parameters structure : (inputObject, path, ...args) !!!
// -------------------------------------------------------------------------------------------------

const translateSummary = async (inputObject, path, args) => {
  const fun = 'translateSummary'
  let result = {}
  try {
    const text = getFirstElementWithPath(inputObject, path)
    const path_lang = getPath(args, API_LANGUAGES_PROPERTY)
    const param_lang = getArgs(args, API_LANGUAGES_PROPERTY).paramName
    const lang = getXmlParam(inputObject, path_lang, param_lang)
    result[DICT_LANG] = lang
    result[DICT_TEXT] = text
    return result
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

const translateSynopsis = async (inputObject, path, args) => {
  const fun = 'translateSynopsis'
  try {
    let result = await translateSummary(inputObject, path, args)
    if (result[DICT_TEXT].length > 150) {
      result[DICT_TEXT] = result[DICT_TEXT].substring(0, 149)
    }
    return result
  } catch (e) {
    throw RudiError.treatError(mod, fun, e)
  }
}

const translateTheme = async (inputObject, path, args) => {
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

const translateKeywords = async (inputObject, path, args) => {
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
        `No valid contact was found. Reminder : a valid contact must have ${args.paramCondition} set to ${args.paramExpectedValue}`,
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

const translateAvailableFormats = async (inputObject, path, args) => {
  const fun = 'translateAvailableFormats'

  let result = []
  try {
    const mediaList = getElementWithPath(inputObject, path)

    await Promise.all(
      mediaList.map((media) => {
        let promiseResult = translateOneMedia(media)
        promiseResult.then((value) => {
          result.push(value)
        })
        return promiseResult
      })
    )
    if (result.length === 0) {
      throw new BadRequestError(
        `No Media was found in the metada, can't fill the rudi field ${API_MEDIA_PROPERTY}.`,
        mod,
        fun
      )
    }

    let customMediaService = {
      [API_MEDIA_TYPE]: MediaTypes.Service,
      [API_MEDIA_NAME]: 'Link to source metadata',
      [API_MEDIA_CAPTION]:
        'Link to the metadata that was translated in RUDI format. Contains more informations.',
      [API_MEDIA_CONNECTOR]: {
        [API_PUB_URL]: await translateStraightFromPath(inputObject, args.pathToSourceMetadata),
      },
    }

    result.push(customMediaService)
    return result
  } catch (e) {
    throw RudiError.treatError(mod, fun, e)
  }
}

const translateDataDates = async (inputObject, path, args) => {
  const fun = 'translateDataDates'
  const argsCreated = getArgs(args, API_DATES_CREATED)
  const argsEdited = getArgs(args, API_DATES_EDITED)
  const pathCreated = getPath(args, API_DATES_CREATED)
  const pathEdited = getPath(args, API_DATES_EDITED)
  let result = {}
  try {
    const datesList = getElementWithPath(inputObject, path)
    for (const date of datesList) {
      let paramValueCreated = arrayCheck(
        findXmlParam(date, argsCreated.relativePathCondition, argsCreated.paramCondition)
      )
      let paramValueEdited = arrayCheck(
        findXmlParam(date, argsEdited.relativePathCondition, argsEdited.paramCondition)
      )

      if (paramValueCreated !== undefined && paramValueCreated === argsCreated.paramExpectedValue) {
        result[API_DATES_CREATED] = getFirstElementWithPath(date, pathCreated)
      }

      if (paramValueEdited !== undefined && paramValueEdited === argsEdited.paramExpectedValue) {
        result[API_DATES_EDITED] = getFirstElementWithPath(date, pathEdited)
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

const translateAccessCondition = async (inputObject, path, args) => {
  const fun = 'translateAccessCondition'
  let result = {}
  try {
    inputObject = getFirstElementWithPath(inputObject, path)
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

const translateLicence = async (inputObject, path, args) => {
  const fun = 'translateLicence'
  let relativePathCharacter = args.relativePathCharacter
  let result = {}
  try {
    const objLicenceLabel = getElementWithPath(inputObject, path)
    let labelsLicences = await getLicenceLabels()

    let correspondingRudiLicenceCode = []
    for await (const objLicenceCode of objLicenceLabel) {
      let licenceCode = getFirstElementWithPath(objLicenceCode, relativePathCharacter)
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
      let defaultLabel = getFirstElementWithPath(inputObject, pathToDefaultLabel)
      logI(mod, fun, 'No corresponding Rudi Licence was found. Custom licence was created.')
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

export const translateGlobalId = async (inputObject, path, args) => {
  const fun = 'translateGlobalId'
  try {
    const localId = getFirstElementWithPath(inputObject, args)
    const objectInRudiDb = await getObject(
      OBJ_METADATA,
      { [API_METADATA_LOCAL_ID]: localId },
      false
    )
    return objectInRudiDb?.[API_METADATA_ID]
  } catch (e) {
    throw RudiError.treatError(mod, fun, e)
  }
}

export const translateOrganization = async (inputObject, path, args) => {
  const fun = 'translateOrganization'
  try {
    const organization = getElementWithPath(inputObject, path)
    return await GmdXmlToRudiOrgaTranslator.translateInputObject(organization)
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
      getPath(PATHS_GMD_TO_RUDI, API_DATA_PRODUCER_PROPERTY)
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
    GmdXmlToRudiGeoTranslator,
    new ObjectTranslator(API_METAINFO_PROPERTY, STANDARD_GMD, FORMAT_XML, true, [], {}, [
      new FieldTranslator(
        API_METAINFO_VERSION_PROPERTY,
        async (inputObject, path, args) => {
          return API_VERSION
        },
        true
      ),
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
    ]),
  ],
  xml2jsonParser
)
