const mod = 'metadataTrslat'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import {
  FORMAT_XML,
  PATHS_GMD_TO_RUDI,
  STANDARD_GMD,
} from '../config/confTranslation/gmd/confGmdXml.js'
import { OBJ_CONTACTS, OBJ_ORGANIZATIONS } from '../config/constApi.js'

import {
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
  API_MEDIA_PROPERTY,
  API_METADATA_LOCAL_ID,
  API_THEME_PROPERTY,
  DICT_LANG,
  DICT_TEXT,
} from '../db/dbFields.js'

import { BadRequestError, RudiError } from '../utils/errors.js'

import {
  arrayCheck,
  findXmlParam,
  getArgs,
  getElementWithPath,
  getPath,
  getXmlParam,
  translateStraightFromPath,
} from './genericTranslationFunctions.js'
import { FieldTranslator } from './genericTranslator.js'
import { translatorObjects } from './translationTools.js'

import { logI } from '../utils/logging.js'
import { translateOneMedia } from './mediaTranslator.js'

// -------------------------------------------------------------------------------------------------
// Translation functions for metadata.
// !!! All these functions must have the same parameters structure : (metadata, path, ...args) !!!
// -------------------------------------------------------------------------------------------------

const translateSummary = async function (metadata, path, args) {
  const fun = 'translateSummary'
  let text
  try {
    text = arrayCheck(await getElementWithPath(metadata, path))
  } catch (err) {
    throw new RudiError(err, null, null, null, null, mod, fun)
  }
  let lang
  try {
    const path_lang = args[0].path
    const param_lang = args[0].args.paramName
    lang = await getXmlParam(metadata, path_lang, param_lang)
  } catch (err) {
    throw new RudiError(err, null, null, null, null, mod, fun)
  }
  let result = {}
  result[DICT_LANG] = lang
  result[DICT_TEXT] = text
  return result
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
      throw new RudiError(err, null, null, null, null, mod, fun)
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
          arrayCheck(await getElementWithPath(elemKeyword, relativePathCharacter))
        )
      }
    } catch (err) {
      throw new RudiError(err, null, null, null, null, mod, fun)
    }
  }
  if (keywords.length === 0) {
    throw new BadRequestError(`No keyword was found in origin Metadata`, mod, fun)
  } else {
    return keywords
  }
}

const translateOrg = async function (metadata, path, args) {
  const fun = 'translateOrg'

  let orgs = []
  try {
    const potentialOrgs = await getElementWithPath(metadata, path) //get all possible organizations of the metadata
    for await (const org of potentialOrgs) {
      let paramValue = await findXmlParam(org, args.relativePathCondition, args.paramCondition)
      if (paramValue === args.paramExpectedValue) {
        orgs.push(org)
      }
    }
  } catch (e) {
    throw new RudiError(e)
  }
  if (orgs.length === 0) {
    throw new BadRequestError(
      `No valid producer/organization was found. Reminder : a valid producer/organization must have ${args.paramCondition} set to ${args.paramExpectedValue}`
    )
  }

  let orgTranslator
  try {
    orgTranslator = translatorObjects[OBJ_ORGANIZATIONS][STANDARD_GMD][FORMAT_XML]
  } catch (e) {
    throw new RudiError('!!! No organization translator was found !!!')
  }

  if (orgs.length > 1) {
    logI(mod, fun, 'Several producer were found, first is taken.')
  }

  return await orgTranslator.translate(orgs[0])
}

const translateContact = async function (metadata, path, args) {
  const fun = 'translateContact'

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
    throw new RudiError(e)
  }

  if (allContacts.length === 0) {
    throw new BadRequestError(
      `No valid contact was found. Reminder : a valid contact must have ${args.paramCondition} set to ${args.paramExpectedValue}`
    )
  }
  let contactTranslator
  try {
    contactTranslator = translatorObjects[OBJ_CONTACTS][STANDARD_GMD][FORMAT_XML]
  } catch (e) {
    throw new RudiError('!!! No contact translator was found !!!')
  }

  let result = []
  try {
    for await (const newContact of allContacts) {
      result.push(await contactTranslator.translate(newContact))
    }
  } catch (e) {
    throw new RudiError(e)
  }
  return result
}

const translateAvailableFormats = async function (metadata, path, args) {
  const fun = 'translateAvailableFormats'

  let result = []
  try {
    const mediaList = await getElementWithPath(metadata, path)
    for await (const media of mediaList) {
      result.push(await translateOneMedia(media))
    }
  } catch (e) {
    throw new RudiError(e)
  }

  if (result.length === 0) {
    throw new BadRequestError(
      `No Media was found in the metada, can't fill the rudi field ${API_MEDIA_PROPERTY}`
    )
  }
  return result
}

const translateDataDates = async function (metadata, path, args) {
  const fun = 'translateDataDates'
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
        result[API_DATES_CREATED] = arrayCheck(await getElementWithPath(date, pathCreated))
      }

      if (paramValueEdited !== undefined && paramValueEdited === argsEdited.paramExpectedValue) {
        result[API_DATES_EDITED] = arrayCheck(await getElementWithPath(date, pathEdited))
      }
    }
  } catch (e) {
    throw new RudiError(e)
  }
  if (!(API_DATES_CREATED in result)) {
    throw new BadRequestError(`Rudi field ${API_DATES_CREATED} can not be filled !`)
  }
  if (!(API_DATES_EDITED in result)) {
    throw new BadRequestError(`Rudi field ${API_DATES_EDITED} can not be filled !`)
  }
  return result
}

// -------------------------------------------------------------------------------------------------
// Translators from gmd-xml metadata to rudi.
// -------------------------------------------------------------------------------------------------

export const fieldTranslatorsMetadataGmdXml = [
  // new FieldTranslator(API_METADATA_ID, translateStraightFromPath, {
  //   path: getPath(PATHS_GMD_TO_RUDI, API_METADATA_ID),
  // }),
  new FieldTranslator(API_METADATA_LOCAL_ID, translateStraightFromPath, {
    path: getPath(PATHS_GMD_TO_RUDI, API_METADATA_LOCAL_ID),
  }),
  new FieldTranslator(API_DATA_NAME_PROPERTY, translateStraightFromPath, {
    path: getPath(PATHS_GMD_TO_RUDI, API_DATA_NAME_PROPERTY),
  }),
  new FieldTranslator(API_DATA_DETAILS_PROPERTY, translateSynopsis, {
    path: getPath(PATHS_GMD_TO_RUDI, API_DATA_DETAILS_PROPERTY),
    args: [PATHS_GMD_TO_RUDI[API_LANGUAGES_PROPERTY]],
  }),
  new FieldTranslator(API_DATA_DESCRIPTION_PROPERTY, translateSummary, {
    path: getPath(PATHS_GMD_TO_RUDI, API_DATA_DESCRIPTION_PROPERTY),
    args: [PATHS_GMD_TO_RUDI[API_LANGUAGES_PROPERTY]],
  }),
  new FieldTranslator(API_THEME_PROPERTY, translateTheme, {
    path: getPath(PATHS_GMD_TO_RUDI, API_THEME_PROPERTY),
    args: getArgs(PATHS_GMD_TO_RUDI, API_THEME_PROPERTY),
  }),
  new FieldTranslator(API_KEYWORDS_PROPERTY, translateKeywords, {
    path: getPath(PATHS_GMD_TO_RUDI, API_THEME_PROPERTY),
    args: getArgs(PATHS_GMD_TO_RUDI, API_THEME_PROPERTY),
  }),
  new FieldTranslator(API_DATA_PRODUCER_PROPERTY, translateOrg, {
    path: getPath(PATHS_GMD_TO_RUDI, API_DATA_PRODUCER_PROPERTY),
    args: getArgs(PATHS_GMD_TO_RUDI, API_DATA_PRODUCER_PROPERTY),
  }),
  new FieldTranslator(API_DATA_CONTACTS_PROPERTY, translateContact, {
    path: getPath(PATHS_GMD_TO_RUDI, API_DATA_CONTACTS_PROPERTY),
    args: getArgs(PATHS_GMD_TO_RUDI, API_DATA_CONTACTS_PROPERTY),
  }),
  new FieldTranslator(API_MEDIA_PROPERTY, translateAvailableFormats, {
    path: getPath(PATHS_GMD_TO_RUDI, API_MEDIA_PROPERTY),
  }),
  new FieldTranslator(API_DATA_DATES_PROPERTY, translateDataDates, {
    path: getPath(PATHS_GMD_TO_RUDI, API_DATA_DATES_PROPERTY),
    args: getArgs(PATHS_GMD_TO_RUDI, API_DATA_DATES_PROPERTY),
  }),
]

// -------------------------------------------------------------------------------------------------
// Tools
// -------------------------------------------------------------------------------------------------
