'use strict'
// const mod = 'DynEnumSch'

// ------------------------------------------------------------------------------------------------
// External dependencies
// ------------------------------------------------------------------------------------------------
const mongoose = require('mongoose')
const { omit } = require('lodash')

// ------------------------------------------------------------------------------------------------
// Internal dependencies
// ------------------------------------------------------------------------------------------------
const { FIELDS_TO_SKIP } = require('../../db/dbFields')
const DictionaryEntry = require('../schemas/Dictiogit naryEntry')

// ------------------------------------------------------------------------------------------------
// Custom schema definition
// ------------------------------------------------------------------------------------------------
exports.ENUM_CODE = 'code'
exports.ENUM_VALUES = 'values'

exports.ENUM_KEY = 'key'
exports.ENUM_LABELS = 'labels'
exports.ENUM_LABELLED_VALUES = 'labelledValues'

const DynamicEnumSchema = new mongoose.Schema(
  {
    [this.ENUM_CODE]: {
      type: String,
      unique: true,
      index: true,
      required: true,
    },
    [this.ENUM_VALUES]: {
      type: [String],
    },
    [this.ENUM_LABELLED_VALUES]: {
      [this.ENUM_KEY]: String,
      [this.ENUM_LABELS]: [DictionaryEntry],
    },
  },
  {
    timestamps: true,
    id: false,
    toObject: {
      getters: true,
      setters: true,
      virtuals: true,
    },
    toJSON: {
      getters: true,
      setters: true,
      virtuals: true,
    },
  }
)

// ------------------------------------------------------------------------------------------------
// Schema refinements
// ------------------------------------------------------------------------------------------------

// ----- toJSON cleanup
DynamicEnumSchema.methods.toJSON = function () {
  return omit(this.toObject(), FIELDS_TO_SKIP)
}

// ------------------------------------------------------------------------------------------------
// Exports
// ------------------------------------------------------------------------------------------------
exports.DynamicEnum = mongoose.model('DynamicEnum', DynamicEnumSchema)
