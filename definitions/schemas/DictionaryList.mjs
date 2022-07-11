// ------------------------------------------------------------------------------------------------
// External dependencies
// ------------------------------------------------------------------------------------------------
import mongoose from 'mongoose'
import { DICT_LANG, DICT_TEXT } from '../../db/dbFields.mjs'

// ------------------------------------------------------------------------------------------------
// Internal dependencies
// ------------------------------------------------------------------------------------------------
import { get as getLanguages } from '../thesaurus/Languages.mjs'
const Languages = getLanguages()

// ------------------------------------------------------------------------------------------------
// Custom schema definition
// ------------------------------------------------------------------------------------------------
const DictionaryList = new mongoose.Schema(
  {
    [DICT_LANG]: {
      type: String,
      default: Languages.fr,
      enum: Object.values(Languages),
      required: true,
    },
    [DICT_TEXT]: {
      type: [String], // THE difference with DictionaryEntry: we can have several labels per langauge here !
      required: true,
    },
  },
  {
    _id: false,
  }
)

// ------------------------------------------------------------------------------------------------
// Exports
// ------------------------------------------------------------------------------------------------
export default DictionaryList
