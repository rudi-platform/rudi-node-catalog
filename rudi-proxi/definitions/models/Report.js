'use strict';

//———————————————————————————————————————————————————————————————
// External dependancies
//———————————————————————————————————————————————————————————————
const mongoose = require('mongoose');
const Int32 = require('mongoose-int32');

//———————————————————————————————————————————————————————————————
// Internal dependancies
//———————————————————————————————————————————————————————————————

const ids = require('../schemas/Identifiers')
const api = require('../../config/confApi')


//———————————————————————————————————————————————————————————————
// Constants
//———————————————————————————————————————————————————————————————
const IntegrationResults = {
  OK: 'OK',
  KO: 'KO'
}

const IntegrationError = new mongoose.Schema({
  error_code: {
    type: Int32,
    min: 0,
    required: true
  },
  error_message: {
    type: String,
    required: true
  },
  field_name: {
    type: String
  },
}, {
  timestamps: true
});

//----- toJSON cleanup
IntegrationError.methods.toJSON = function () {
  var doc = this.toObject()
  // metadata[API_METAINFO_PROPERTY][API_METAINFO_DATES_PROPERTY][API_DATES_CREATED_PROPERTY] = metadata.createdAt
  // metadata[API_METAINFO_PROPERTY][API_METAINFO_DATES_PROPERTY][API_DATES_EDITED_PROPERTY] = metadata.updatedAt
  delete doc._id
  delete doc.__v
  delete doc.createdAt
  delete doc.updatedAt
  return doc
};

//———————————————————————————————————————————————————————————————
// Custom schema definitions
//———————————————————————————————————————————————————————————————

const ReportSchema = new mongoose.Schema({

  // Unique identifier of the integration report (required)
  report_id: ids.UUIDv4,

  // Unique and permanent identifier for the resource in RUDI 
  // system (required)
  resource_id: ids.UUID,

  resource_title: String,

  // Date when the integration request was submitted by the Producer
  submission_date: Date,

  // Date when the integration request was processed by the Portal
  treatment_date: Date,

  // Method used for the integration request by the Producer
  method: {
    type: String,
    enum: Object.values(api.HttpMethods)
  },

  // Version number of the integration contract used for the file
  version: {
    type: Int32,
    min: 0
  },

  // State of the integration of the resource in the Portal
  integration_status: {
    type: String,
    enum: Object.values(IntegrationResults),
  },

  // Comment on the state of the integration of the resource in the
  // Portal
  comment: {
    type: String
  },

  // List of all the errors that were encounntered during the
  // integration of the resource.
  integration_errors: [IntegrationError]
}, {
  timestamps: true
});


//----- toJSON cleanup
ReportSchema.methods.toJSON = function () {
  var doc = this.toObject()
  // metadata[API_METAINFO_PROPERTY][API_METAINFO_DATES_PROPERTY][API_DATES_CREATED_PROPERTY] = metadata.createdAt
  // metadata[API_METAINFO_PROPERTY][API_METAINFO_DATES_PROPERTY][API_DATES_EDITED_PROPERTY] = metadata.updatedAt
  delete doc._id
  delete doc.__v
  delete doc.createdAt
  delete doc.updatedAt
  return doc
};

//———————————————————————————————————————————————————————————————
// Exports
//———————————————————————————————————————————————————————————————
module.exports = mongoose.model('Report', ReportSchema)