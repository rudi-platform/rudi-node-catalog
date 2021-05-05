// ---------------------------------------------------------------
// External dependancies
// ---------------------------------------------------------------
const mongoose = require('mongoose')
const _ = require('lodash')

// ---------------------------------------------------------------
// Schema definitions
// ---------------------------------------------------------------
const Validation = require('../schemaValidators')
const DictionaryEntry = require('../schemas/DictionaryEntry')

// ---------------------------------------------------------------
// Constants
// ---------------------------------------------------------------
const LicenceTypes = {
  Standard: 'STANDARD',
  Custom: 'CUSTOM'
}

const {
  API_METADATA_LICENCE_TYPE,
  FIELDS_TO_SKIP
} = require('../../db/dbFields')
const options = {
  discriminatorKey: API_METADATA_LICENCE_TYPE,
  timestamps: true,
  id: false
}

// ---------------------------------------------------------------
// Custom schema definition: Licence
// ---------------------------------------------------------------
const LicenceSchema = new mongoose.Schema({
  /** Enum to differenciate standard from custom licence */
  licence_type: {
    type: String,
    enum: Object.values(LicenceTypes),
    required: true
  },
}, options)

// ---------------------------------------------------------------
// Standard licence schema definition
// ---------------------------------------------------------------
const LicenceStandardSchema = new mongoose.Schema({
  /** Standard license (recognized by RUDI system) */
  licence_label: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SkosConcept',
    required: true
  },
}, options)

// ---------------------------------------------------------------
// Custom licence schema definition
// ---------------------------------------------------------------
const LicenceCustomSchema = new mongoose.Schema({

  /** Title of the custom licence */
  custom_licence_label: {
    type: [DictionaryEntry]
  },

  /** Informative URL towards the custom licence */
  custom_licence_uri: {
    type: String,
    unique: true,
    match: Validation.URI,
  },
}, options)

// ---------------------------------------------------------------
// Schema refinements
// ---------------------------------------------------------------

// ----- toJSON cleanup
LicenceSchema.methods.toJSON = function () {
  return _.omit(this.toObject(), FIELDS_TO_SKIP)
}
LicenceStandardSchema.methods.toJSON = function () {
  return _.omit(this.toObject(), FIELDS_TO_SKIP)
}
LicenceCustomSchema.methods.toJSON = function () {
  return _.omit(this.toObject(), FIELDS_TO_SKIP)
}

/*
LicenceSchema.pre('save', function (next) {
  const fun = 'pre hook'
  try {
    if (this.licence_label) {
      if (!!this.custom_licence_label) {
        throw (new Error(`If a classic licence is selected, no custom licence label shouldn't be provided`))
      } else if (!!this.custom_licence_uri) {
        throw (new Error(`If a classic licence is selected, no informative url for a custom licence shouldn't be provided`))
      }
    } else {
      // Custom licence
      if (!this.custom_licence_label) {
        throw (new Error(`A licence is required, either classic or custom`))
      } else if (!this.custom_licence_uri) {
        throw (new Error(`An informative URL should be provided for the custom licence`))
      }
    }
  } catch (err) {
    next(err)
  }
  next()
})
 */

// ---------------------------------------------------------------
// Models definition
// ---------------------------------------------------------------
const Licence = mongoose.model('Licence', LicenceSchema)

const LicenceStandard = Licence.discriminator(LicenceTypes.Standard, LicenceStandardSchema)
const LicenceCustom = Licence.discriminator(LicenceTypes.Custom, LicenceCustomSchema)

// ---------------------------------------------------------------
// Exports
// ---------------------------------------------------------------
module.exports = {
  Licence,
  LicenceStandard,
  LicenceCustom,
  LicenceTypes
}