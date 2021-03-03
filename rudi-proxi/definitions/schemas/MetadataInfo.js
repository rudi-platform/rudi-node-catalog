//———————————————————————————————————————————————————————————————
// API version
//———————————————————————————————————————————————————————————————
const {
  API_VERSION
} = require('../../routes/apiUrl');

//———————————————————————————————————————————————————————————————
// External dependencies
//———————————————————————————————————————————————————————————————
const mongoose = require('mongoose');

//———————————————————————————————————————————————————————————————
// Internal dependencies
//———————————————————————————————————————————————————————————————
const Validation = require('../schemaValidators');


//———————————————————————————————————————————————————————————————
// Schema definitions
//———————————————————————————————————————————————————————————————
const ReferenceDates = require('../schemas/ReferenceDates');

//———————————————————————————————————————————————————————————————
// Model definitions
//———————————————————————————————————————————————————————————————
const Organization = require('./Organization');
const Contact = require('./Contact');


//———————————————————————————————————————————————————————————————
// Custom schema definitions
//———————————————————————————————————————————————————————————————
const MetadataInfoSchema = new mongoose.Schema({
  // API version number (used for retro-compatibility)
  api_version: {
    type: String,
    required: true,
    validate: {
      validator: Validation.isVersion,
      message: '{VALUE} does not appear to be a valid version number (0.0.0abc)'
    }
  },

  // Dates of the actions performed on the metadata (creation, publishing, update...)
  metadata_dates: {
    type: ReferenceDates,
    required: true
  },

  // Description of the organization that produced the metadata
  metadata_provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization'
  },

  // Addresses to get further information on the metadata
  metadata_contacts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact'
  }]
});

//———————————————————————————————————————————————————————————————
// Exports
//———————————————————————————————————————————————————————————————
module.exports = mongoose.model('MetadataInfo', MetadataInfoSchema);