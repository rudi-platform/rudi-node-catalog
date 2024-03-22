import {
  API_DATA_NAME_PROPERTY,
  API_METADATA_ID,
  API_METADATA_LOCAL_ID,
} from '../../db/dbFields.js'

export const PATHS_GMD_TO_RUDI = {}

PATHS_GMD_TO_RUDI[API_METADATA_ID] = [
  'gmd:MD_Metadata',
  'gmd:fileIdentifier',
  'gco:CharacterString',
]
PATHS_GMD_TO_RUDI[API_METADATA_LOCAL_ID] = [
  'gmd:MD_Metadata',
  'gmd:identificationInfo',
  'gmd:MD_DataIdentification',
  'gmd:citation',
  'gmd:CI_Citation',
  'gmd:identifier',
  'gmd:MD_Identifier',
  'gmd:code',
  'gco:CharacterString',
]
PATHS_GMD_TO_RUDI[API_DATA_NAME_PROPERTY] = [
  'gmd:MD_Metadata',
  'gmd:identificationInfo',
  'gmd:MD_DataIdentification',
  'gmd:citation',
  'gmd:CI_Citation',
  'gmd:title',
  'gco:CharacterString',
]
