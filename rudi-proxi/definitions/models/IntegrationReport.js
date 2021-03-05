//———————————————————————————————————————————————————————————————
// External dependancies
//———————————————————————————————————————————————————————————————
const mongoose = require('mongoose');
const Int32 = require('mongoose-int32');

//———————————————————————————————————————————————————————————————
// Internal dependancies
//———————————————————————————————————————————————————————————————

const Ids = require('../schemas/Identifiers')
const {
  HttpMethods: Request
} = require('../../config/confApi')


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
    min: 0
  },
  error_message: String,
  field_name: String
});

//———————————————————————————————————————————————————————————————
// Custom schema definitions
//———————————————————————————————————————————————————————————————

const IntegrationReportSchema = new mongoose.Schema({

  // Unique identifier of the integration report (required)
  report_id: Ids.UUIDv4,

  // Unique and permanent identifier for the resource in RUDI 
  // system (required)
  resource_id: Ids.UUIDv4,

  resource_title: String,

  // Date when the integration request was submitted by the Producer
  submission_date: Date,

  // Date when the integration request was processed by the Portal
  treatment_date: Date,

  // Method used for the integration request by the Producer
  method: Object.values(Request),

  // Version number of the integration contract used for the file
  version: {
    type: Int32,
    min: 0
  },

  // State of the integration of the resource in the Portal
  integration_status: {
    method: Object.values(IntegrationResults),
  },

  // Comment on the state of the integration of the resource in the
  // Portal
  comment: String,

  // List of all the errors that were encounntered during the
  // integration of the resource.
  integration_errors: [IntegrationError]

});



//———————————————————————————————————————————————————————————————
// Exports
//———————————————————————————————————————————————————————————————
module.exports = mongoose.model('IntegrationReport', IntegrationReportSchema)