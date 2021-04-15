'use strict';

//---------------------------------------------------------------
// External dependancies
//---------------------------------------------------------------
const mongoose = require('mongoose');

//---------------------------------------------------------------
// Internal dependancies
//---------------------------------------------------------------
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
  id: false,

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
  var obj = this.toObject()
  delete obj._id
  delete obj.__v
  delete obj.createdAt
  delete obj.updatedAt
  delete obj.publishedAt
  return obj
};

//---------------------------------------------------------------
// Exports
//---------------------------------------------------------------
module.exports = mongoose.model('Organization', OrganizationSchema)