'use strict'

const mod = 'orgSch'
// ------------------------------------------------------------------------------------------------
// External dependencies
// ------------------------------------------------------------------------------------------------
const mongoose = require('mongoose')
const { omit } = require('lodash')

// ------------------------------------------------------------------------------------------------
// Internal dependencies
// ------------------------------------------------------------------------------------------------
const log = require('../../utils/logging')
const ids = require('../schemas/Identifiers')
const { RudiError } = require('../../utils/errors')
const { makeSearchable } = require('../../db/dbActions')

// ------------------------------------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------------------------------------
const {
  FIELDS_TO_SKIP,
  DB_PUBLISHED_AT,
  API_ORGANIZATION_ID,
  API_COLLECTION_TAG,
  API_ORGANIZATION_NAME,
  API_ORGANIZATION_ADDRESS,
  API_ORGANIZATION_COORDINATES,
  API_ORGANIZATION_CAPTION,
  API_ORGANIZATION_SUMMARY,
} = require('../../db/dbFields')
const { GpsCoordinates } = require('../schemas/GpsCoordinates')

// ------------------------------------------------------------------------------------------------
// Custom schema definition
// ------------------------------------------------------------------------------------------------
const OrganizationSchema = new mongoose.Schema(
  {
    /**
     * Unique and permanent identifier for the organization in RUDI
     * system (required)
     */
    [API_ORGANIZATION_ID]: ids.UUIDv4,

    /** Updated offical name of the organization */
    [API_ORGANIZATION_NAME]: {
      type: String,
      required: true,
    },

    /** Explicit/complete name for an acronym, or alternative name of the organization */
    [API_ORGANIZATION_CAPTION]: {
      type: String,
    },

    /** Description of the organization */
    [API_ORGANIZATION_SUMMARY]: {
      type: String,
    },

    /** Updated offical postal address of the organization */
    [API_ORGANIZATION_ADDRESS]: {
      type: String,
    },

    /** 2D GPS coordinates of the organization (EPSG:4326/WGS 84) */
    [API_ORGANIZATION_COORDINATES]: {
      type: GpsCoordinates,
    },

    /** Tag for identifying a collection of resources */
    [API_COLLECTION_TAG]: {
      type: String,
    },

    /** Time when this organization was succesfully published on RUDI portal */
    [DB_PUBLISHED_AT]: {
      type: Date,
    },
  },
  {
    // Adds mongoose fields 'updatedAt' and 'createdAt'
    timestamps: true,
    id: false,

    // optimisticConcurrency: true,
    // strict: true,
    // runSettersOnQuery: true,
    // toObject: {
    //   getters: true,
    //   setters: true,
    //   virtuals: false
    // },
  }
)

// ------------------------------------------------------------------------------------------------
// Schema refinements
// ------------------------------------------------------------------------------------------------

// ----- toJSON cleanup
OrganizationSchema.methods.toJSON = function () {
  return omit(this.toObject(), FIELDS_TO_SKIP)
}

// ------------------------------------------------------------------------------------------------
// Exports
// ------------------------------------------------------------------------------------------------
const Organization = mongoose.model('Organization', OrganizationSchema)

Organization.getSearchableFields = () => [API_ORGANIZATION_ID, API_ORGANIZATION_NAME]

Organization.initialize = async () => {
  const fun = 'initOrganization'
  try {
    await makeSearchable(Organization)
    log.d(mod, fun, `Indexes created`)
  } catch (err) {
    RudiError.treatError(mod, fun, err)
  }
}
// ------------------------------------------------------------------------------------------------
// Exports
// ------------------------------------------------------------------------------------------------
module.exports = { Organization }
