'use strict'

// -----------------------------------------------------------------------------
// External dependancies
// -----------------------------------------------------------------------------
const mongoose = require('mongoose')
const Int32 = require('mongoose-int32')
const _ = require('lodash')

// -----------------------------------------------------------------------------
// Internal dependancies
// -----------------------------------------------------------------------------

const ids = require('../schemas/Identifiers')
const api = require('../../config/confApi')

const Validation = require('../schemaValidators')
const { FIELDS_TO_SKIP } = require('../../db/dbFields')
// const IntegrationStatus = require('../enums/IntegrationStatus')

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------
exports.IntegrationStatus = {
  OK: 'OK',
  KO: 'KO',
}

// -----------------------------------------------------------------------------
// Custom schema definition: Report
// -----------------------------------------------------------------------------

const ReportSchema = new mongoose.Schema(
  {
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
      enum: Object.values(api.HttpMethods),
    },

    // Version number of the integration contract used for the file
    version: {
      type: String,
      required: true,
      match: Validation.API_VERSION,
    },

    // State of the integration of the resource in the Portal
    integration_status: {
      type: String,
      enum: Object.values(this.IntegrationStatus),
    },

    // Comment on the state of the integration of the resource in the
    // Portal
    comment: {
      type: String,
    },

    // List of all the errors that were encounntered during the
    // integration of the resource.
    integration_errors: {
      type: [
        {
          error_code: {
            type: Int32,
            min: 0,
            required: true,
          },
          error_message: {
            type: String,
            required: true,
          },
          field_name: {
            type: String,
          },
        },
      ],
    },

    report_treatment_error: {
      error_type: String,
      error_message: String,
    },
  },
  {
    timestamps: true,
    id: false,
  }
)

// ----- toJSON cleanup
ReportSchema.methods.toJSON = function () {
  return _.omit(this.toObject(), FIELDS_TO_SKIP)
}


ReportSchema.pre('save', async function (next) {
  const fun = 'pre save hook'
  log.d(mod, fun, ``)

  if(this.version == 'v1') this.version = api.VERSION
  next()
})

// -----------------------------------------------------------------------------
// Models definition
// -----------------------------------------------------------------------------
exports.Report = mongoose.model('Report', ReportSchema)
