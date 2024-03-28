import {
  API_CONTACT_MAIL,
  API_CONTACT_NAME,
  API_CONTACT_ROLE,
  API_DATA_CONTACTS_PROPERTY,
  API_DATA_DATES_PROPERTY,
  API_DATA_DESCRIPTION_PROPERTY,
  API_DATA_DETAILS_PROPERTY,
  API_DATA_NAME_PROPERTY,
  API_DATA_PRODUCER_PROPERTY,
  API_DATES_CREATED,
  API_DATES_EDITED,
  API_LANGUAGES_PROPERTY,
  API_MEDIA_CAPTION,
  API_MEDIA_INTERFACE_CONTRACT,
  API_MEDIA_NAME,
  API_MEDIA_PROPERTY,
  API_METADATA_LOCAL_ID,
  API_ORGANIZATION_ADDRESS,
  API_ORGANIZATION_NAME,
  API_PUB_URL,
  API_THEME_PROPERTY,
} from '../../../db/dbFields.js'

// -------------------------------------------------------------------------------------------------
// Standards / Ontologies for objects. Ex : dcat, gmd, rudi
// -------------------------------------------------------------------------------------------------
export const STANDARD_GMD = 'gmd'
export const STANDARD_DCAT = 'dcat'
export const STANDARD_RUDI = 'rudi'
export const DEFAULT_OBJECT_STANDARD = STANDARD_RUDI

// -------------------------------------------------------------------------------------------------
// Formats for objects. Ex : xml, json
// -------------------------------------------------------------------------------------------------
export const FORMAT_XML = 'xml'
export const FORMAT_JSON = 'json'
export const DEFAULT_OBJECT_FORMAT = FORMAT_JSON

// -------------------------------------------------------------------------------------------------
// Paths in GMD metadata to rudi
// -------------------------------------------------------------------------------------------------

export const PATHS_GMD_TO_RUDI = {
  // [API_METADATA_LOCAL_ID]: {
  //   path: [
  //     'gmd:MD_Metadata',
  //     'gmd:identificationInfo',
  //     'gmd:MD_DataIdentification',
  //     'gmd:citation',
  //     'gmd:CI_Citation',
  //     'gmd:identifier',
  //     'gmd:MD_Identifier',
  //     'gmd:code',
  //     'gco:CharacterString',
  //   ],
  // },

  [API_METADATA_LOCAL_ID]: {
    path: ['gmd:MD_Metadata', 'gmd:fileIdentifier', 'gco:CharacterString'],
  },

  [API_DATA_NAME_PROPERTY]: {
    path: [
      'gmd:MD_Metadata',
      'gmd:identificationInfo',
      'gmd:MD_DataIdentification',
      'gmd:citation',
      'gmd:CI_Citation',
      'gmd:title',
      'gco:CharacterString',
    ],
  },

  [API_DATA_DETAILS_PROPERTY]: {
    path: [
      'gmd:MD_Metadata',
      'gmd:identificationInfo',
      'gmd:MD_DataIdentification',
      'gmd:abstract',
      'gco:CharacterString',
    ],
  },

  [API_DATA_DESCRIPTION_PROPERTY]: {
    path: [
      'gmd:MD_Metadata',
      'gmd:identificationInfo',
      'gmd:MD_DataIdentification',
      'gmd:abstract',
      'gco:CharacterString',
    ],
  },

  [API_LANGUAGES_PROPERTY]: {
    path: ['gmd:MD_Metadata', 'gmd:language', 'gmd:LanguageCode'],
    args: {
      paramName: 'codeListValue',
    },
  },

  [API_THEME_PROPERTY]: {
    path: [
      'gmd:MD_Metadata',
      'gmd:identificationInfo',
      'gmd:MD_DataIdentification',
      'gmd:descriptiveKeywords',
    ],

    args: {
      relativePathKeyword: ['gmd:MD_Keywords', 'gmd:keyword'],
      relativePathCharacter: ['gco:CharacterString'],
      relativePathCondition: ['gmd:MD_Keywords', 'gmd:type', 'gmd:MD_KeywordTypeCode'],
      paramCondition: 'codeListValue',
      paramExpectedValue: 'theme',
    },
  },

  [API_DATA_PRODUCER_PROPERTY]: {
    path: [
      'gmd:MD_Metadata',
      'gmd:identificationInfo',
      'gmd:MD_DataIdentification',
      'gmd:pointOfContact',
    ],
    args: {
      relativePathCondition: ['gmd:CI_ResponsibleParty', 'gmd:role', 'gmd:CI_RoleCode'],
      paramCondition: 'codeListValue',
      paramExpectedValue: 'custodian',
      [API_ORGANIZATION_NAME]: {
        // !!! relative path from PATHS_GMD_TO_RUDI[API_DATA_PRODUCER_PROPERTY].path !!!
        path: ['gmd:CI_ResponsibleParty', 'gmd:organisationName', 'gco:CharacterString'],
      },
      [API_ORGANIZATION_ADDRESS]: {
        // !!! relative path from PATHS_GMD_TO_RUDI[API_DATA_PRODUCER_PROPERTY].path !!!
        path: [
          'gmd:CI_ResponsibleParty',
          'gmd:contactInfo',
          'gmd:CI_Contact',
          'gmd:address',
          'gmd:CI_Address',
        ],
        args: {
          fieldsToConcat: ['gmd:deliveryPoint', 'gmd:city', 'gmd:postalCode', 'gmd:country'],
          relativePathCharacter: ['gco:CharacterString'],
        },
      },
    },
  },

  [API_DATA_CONTACTS_PROPERTY]: {
    path: [
      'gmd:MD_Metadata',
      'gmd:identificationInfo',
      'gmd:MD_DataIdentification',
      'gmd:pointOfContact',
    ],
    args: {
      relativePathCondition: ['gmd:CI_ResponsibleParty', 'gmd:role', 'gmd:CI_RoleCode'],
      paramCondition: 'codeListValue',
      paramExpectedValue: 'pointOfContact',
      [API_CONTACT_NAME]: {
        path: ['gmd:CI_ResponsibleParty', 'gmd:individualName', 'gco:CharacterString'],
      },
      [API_ORGANIZATION_NAME]: {
        path: ['gmd:CI_ResponsibleParty', 'gmd:organisationName', 'gco:CharacterString'],
      },
      [API_CONTACT_ROLE]: {
        path: ['gmd:CI_ResponsibleParty', 'gmd:role', 'gmd:CI_RoleCode'],
        args: {
          paramName: 'codeListValue',
        },
      },
      [API_CONTACT_MAIL]: {
        path: [
          'gmd:CI_ResponsibleParty',
          'gmd:contactInfo',
          'gmd:CI_Contact',
          'gmd:address',
          'gmd:CI_Address',
          'gmd:electronicMailAddress',
          'gco:CharacterString',
        ],
      },
    },
  },

  [API_MEDIA_PROPERTY]: {
    path: [
      'gmd:MD_Metadata',
      'gmd:distributionInfo',
      'gmd:MD_Distribution',
      'gmd:transferOptions',
      'gmd:MD_DigitalTransferOptions',
      'gmd:onLine',
    ],
    args: {
      [API_MEDIA_NAME]: {
        path: ['gmd:CI_OnlineResource', 'gmd:name', 'gco:CharacterString'],
      },
      [API_MEDIA_CAPTION]: {
        path: ['gmd:CI_OnlineResource', 'gmd:description', 'gco:CharacterString'],
      },
      [API_PUB_URL]: {
        path: ['gmd:CI_OnlineResource', 'gmd:linkage', 'gmd:URL'],
      },
      [API_MEDIA_INTERFACE_CONTRACT]: {
        path: ['gmd:CI_OnlineResource', 'gmd:protocol', 'gco:CharacterString'],
      },
    },
  },

  [API_DATA_DATES_PROPERTY]: {
    path: [
      'gmd:MD_Metadata',
      'gmd:identificationInfo',
      'gmd:MD_DataIdentification',
      'gmd:citation',
      'gmd:CI_Citation',
      'gmd:date',
    ],
    args: {
      [API_DATES_CREATED]: {
        path: ['gmd:CI_Date', 'gmd:date', 'gco:Date'],
        args: {
          relativePathCondition: ['gmd:CI_Date', 'gmd:dateType', 'gmd:CI_DateTypeCode'],
          paramCondition: 'codeListValue',
          paramExpectedValue: 'creation',
        },
      },
      [API_DATES_EDITED]: {
        path: ['gmd:CI_Date', 'gmd:date', 'gco:Date'],
        args: {
          relativePathCondition: ['gmd:CI_Date', 'gmd:dateType', 'gmd:CI_DateTypeCode'],
          paramCondition: 'codeListValue',
          paramExpectedValue: 'revision',
        },
      },
    },
  },
}
