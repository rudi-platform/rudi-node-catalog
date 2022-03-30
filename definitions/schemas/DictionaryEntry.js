'use strict'

// ------------------------------------------------------------------------------------------------
// External dependencies
// ------------------------------------------------------------------------------------------------
const mongoose = require('mongoose')
const { DICT_LANG, DICT_TEXT } = require('../../db/dbFields')

// ------------------------------------------------------------------------------------------------
// Internal dependencies
// ------------------------------------------------------------------------------------------------
const Language = require('../thesaurus/Languages').get()

// ------------------------------------------------------------------------------------------------
// Custom schema definition
// ------------------------------------------------------------------------------------------------
const DictionaryEntry = new mongoose.Schema(
  {
    [DICT_LANG]: {
      type: String,
      default: Language.fr,
      enum: Object.values(Language),
      required: true,
    },
    [DICT_TEXT]: {
      type: String, // Only one entry per language!
      required: true,
    },
  },
  {
    _id: false,
  }
)

module.exports = DictionaryEntry
