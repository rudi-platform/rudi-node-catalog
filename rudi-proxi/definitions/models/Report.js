'use strict';

//---------------------------------------------------------------
// External dependancies
//---------------------------------------------------------------
const mongoose = require('mongoose');
const Int32 = require('mongoose-int32');

//---------------------------------------------------------------
// Internal dependancies
//---------------------------------------------------------------

const ids = require('../schemas/Identifiers')
const api = require('../../config/confApi')

const Validation = require('../schemaValidators');
const IntegrationStatus = require('../thesaurus/IntegrationStatus')

//---------------------------------------------------------------
// Custom schema definition: Report
//---------------------------------------------------------------

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
    type: String,
    required: true,
    validate: {
      validator: Validation.isVersion,
      message: '{VALUE} does not appear to be a valid version number (0.0.0abc)'
    }
  },

  // State of the integration of the resource in the Portal
  integration_status: {
    type: String,
    enum: Object.values(IntegrationStatus),
  },

  // Comment on the state of the integration of the resource in the
  // Portal
  comment: {
    type: String
  },

  // List of all the errors that were encounntered during the
  // integration of the resource.
  integration_errors: {
    type: [{
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
    }]
  }
}, {
  timestamps: true,
  id: false,
});


//----- toJSON cleanup
ReportSchema.methods.toJSON = function () {
  var obj = this.toObject()
  delete obj._id
  delete obj.__v
  delete obj.createdAt
  delete obj.updatedAt
  return obj
};

//---------------------------------------------------------------
// Exports
//---------------------------------------------------------------
module.exports = mongoose.model('Report', ReportSchema)