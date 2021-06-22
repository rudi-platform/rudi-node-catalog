'use strict'
// const mod = 'DynEnumSch'

// -----------------------------------------------------------------------------
// External dependancies
// -----------------------------------------------------------------------------
const mongoose = require('mongoose')
const _ = require('lodash')

// -----------------------------------------------------------------------------
// Custom schema definition
// -----------------------------------------------------------------------------
const DynamicEnumSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      unique: true,
      index: true,
      required: true,
    },
    values: {
      type: [String],
      required: true,
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

// -----------------------------------------------------------------------------
// Schema refinements
// -----------------------------------------------------------------------------

// ----- toJSON cleanup
DynamicEnumSchema.methods.toJSON = function () {
  return _.omit(this.toObject(), FIELDS_TO_SKIP)
}

// -----------------------------------------------------------------------------
// Exports
// -----------------------------------------------------------------------------
module.exports = mongoose.model('DynamicEnum', DynamicEnumSchema)
