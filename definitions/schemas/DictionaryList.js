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
const DictionaryList = new mongoose.Schema(
  {
    [DICT_LANG]: {
      type: String,
      default: Language.fr,
      enum: Object.values(Language),
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
module.exports = DictionaryList
