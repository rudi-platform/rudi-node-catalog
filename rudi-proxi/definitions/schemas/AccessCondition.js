//———————————————————————————————————————————————————————————————
// External dependancies
//———————————————————————————————————————————————————————————————
const mongoose = require('mongoose')

const DictionaryEntry = require('./DictionaryEntry')
const SkosEntry = require('./SkosEntry')
const Validation = require('../schemaValidators')

//———————————————————————————————————————————————————————————————
// Custom schema definition
//———————————————————————————————————————————————————————————————
const AccessConditionSchema = new mongoose.Schema({

  // Information that MUST be cited every time the data is used
  bibliographical_reference: {
    type: [DictionaryEntry]
  },

  licence: {
    licence_label: {
      type: SkosEntry
    },

    // Title of the custom licence
    custom_licence_label: {
      type: String
    },

    // URL towards the custom licence
    custom_licence_uri: { // TODO: add URI validator
      type: String,
      validate: Validation.isURI
    },

    usage_constraint: {
      type: [DictionaryEntry]
    },

    // Mention that must be cited verbatim in every publication that
    // makes use of the data
    mandatory_mention: {
      type: [DictionaryEntry]
    },

    access_constraint: {
      type: [DictionaryEntry]
    },

    other_constraints: {
      type: [DictionaryEntry]
    }
  }
})

//———————————————————————————————————————————————————————————————
// Exports
//———————————————————————————————————————————————————————————————
module.exports = AccessConditionSchema