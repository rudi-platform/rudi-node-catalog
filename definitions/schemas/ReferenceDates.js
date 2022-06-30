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
    updated: Date,
    validated: Date,
    published: Date,
    expires: Date,
    deleted: Date,
  },
  {
    _id: false,
  }
)

// ------------------------------------------------------------------------------------------------
// Exports
// ------------------------------------------------------------------------------------------------
module.exports = ReferenceDatesSchema
