'use strict';

//---------------------------------------------------------------
// External dependancies
//---------------------------------------------------------------
const mongoose = require('mongoose');

const ids = require('../schemas/Identifiers');
const Validation = require('../schemaValidators');

//---------------------------------------------------------------
// Custom schema definition
//---------------------------------------------------------------
const OrganizationSchema = new mongoose.Schema({
  // Unique and permanent identifier for the organization in RUDI 
  // system (required)
  organization_id: ids.UUIDv4,

  // Updated offical name of the organization
  organization_name: {
    type: String,
    required: true
  },

  // Updated offical postal address of the organization
  organization_address: {
    type: String,
  },

  // Time when this organization was succesfully published on RUDI portal
  publishedAt: {
    type: Date
  }
}, {
  // Adds mongoose fields 'updatedAt' and 'createdAt'
  timestamps: true,

  // optimisticConcurrency: true,
  // strict: true,
  // runSettersOnQuery: true,
  // toObject: {
  //   getters: true,
  //   setters: true,
  //   virtuals: false
  // },
});


//---------------------------------------------------------------
// Schema refinements
//---------------------------------------------------------------

//----- toJSON cleanup
OrganizationSchema.methods.toJSON = function () {
  var orga = this.toObject()
  // metadata[API_METAINFO_PROPERTY][API_METAINFO_DATES_PROPERTY][API_DATES_CREATED_PROPERTY] = metadata.createdAt
  // metadata[API_METAINFO_PROPERTY][API_METAINFO_DATES_PROPERTY][API_DATES_EDITED_PROPERTY] = metadata.updatedAt
  delete orga._id
  delete orga.__v
  delete orga.createdAt
  delete orga.updatedAt
  delete orga.publishedAt
  return orga
};
//---------------------------------------------------------------
// Exports
//---------------------------------------------------------------
module.exports = mongoose.model('Organization', OrganizationSchema)