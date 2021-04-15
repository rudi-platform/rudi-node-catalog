//---------------------------------------------------------------
// External dependancies
//---------------------------------------------------------------
const mongoose = require('mongoose');

//---------------------------------------------------------------
// Schema definitions
//---------------------------------------------------------------
const Validation = require('../schemaValidators');
const DictionaryEntry = require('../Schemas/DictionaryEntry');

//---------------------------------------------------------------
// Model definitions
//---------------------------------------------------------------
const SkosConcept = require('./SkosConcept');

//---------------------------------------------------------------
// Custom schema definition: Licence
//---------------------------------------------------------------
const LicenceSchema = new mongoose.Schema({

  /** Standard license (recognized by RUDI system) */
  licence_label: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SkosConcept',
    required: true
  },

  /** Title of the custom licence */
  custom_licence_label: {
    type: [DictionaryEntry]
  },

  /** Iformative URL towards the custom licence */
  custom_licence_uri: {
    type: String,
    validate: Validation.isURI
  },
}, {
  // Adds mongoose fields 'updatedAt' and 'createdAt'
  timestamps: true,
  id: false,
});


//---------------------------------------------------------------
// Schema refinements
//---------------------------------------------------------------

//----- toJSON cleanup
LicenceSchema.methods.toJSON = function () {
  var obj = this.toObject()
  delete obj._id
  delete obj.__v
  delete obj.createdAt
  delete obj.updatedAt
  return obj
};


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
});
//---------------------------------------------------------------
// Exports
//---------------------------------------------------------------
module.exports = mongoose.model('Licence', LicenceSchema)