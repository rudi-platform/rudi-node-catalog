'use strict'

// ------------------------------------------------------------------------------------------------
// External dependencies
// ------------------------------------------------------------------------------------------------
const mongoose = require('mongoose')

// ------------------------------------------------------------------------------------------------
// Custom schema definition
// ------------------------------------------------------------------------------------------------
const ReferenceDatesSchema = new mongoose.Schema(
  {
    created: {
      type: Date,
      required: [true, `Creation date is required`],
    },
    updated: {
      type: Date,
    },
    validated: {
      type: Date,
    },
    published: {
      type: Date,
    },
    expires: {
      type: Date,
    },
    deleted: {
      type: Date,
    },
  },
  {
    _id: false,
  }
)

// ------------------------------------------------------------------------------------------------
// Exports
// ------------------------------------------------------------------------------------------------
module.exports = ReferenceDatesSchema
