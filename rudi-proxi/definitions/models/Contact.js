'use strict';

//---------------------------------------------------------------
// External dependancies
//---------------------------------------------------------------
const {
  toLower
} = require('lodash')
const mongoose = require('mongoose')

const ids = require('../schemas/Identifiers')
const Validation = require('../schemaValidators')

//---------------------------------------------------------------
// Custom schema definition
//---------------------------------------------------------------
const ContactSchema = new mongoose.Schema({
  // Unique and permanent identifier for the contact in RUDI 
  // system (required)
  contact_id: ids.UUIDv4,

  // Updated offical name of the contact's organization
  organization_name: {
    type: String
  },

  // Updated name of the service, or possibly the person
  contact_name: {
    type: String,
    required: true
  },

  // Updated status of the contact person
  role: {
    type: String
  },

  // Updated offical postal address of the organization
  email: {
    type: String,
    trim: true,
    required: true, //[true, 'Please enter Email Address'],
    unique: true,
    index: true,
    lowercase: true,
    dropDups: true,
    match: Validation.EMAIL
  },

  // Time when this contact was successfully published on RUDI portal
  publishedAt: {
    type: Date
  }
}, {
  timestamps: true,
  id: false,
  // optimisticConcurrency: true,
  // strict: true,
});


//---------------------------------------------------------------
// Schema refinements
//---------------------------------------------------------------

//----- toJSON cleanup
ContactSchema.methods.toJSON = function () {
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
module.exports = mongoose.model('Contact', ContactSchema)