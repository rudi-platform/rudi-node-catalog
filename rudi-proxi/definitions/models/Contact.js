'use strict';

//———————————————————————————————————————————————————————————————
// External dependancies
//———————————————————————————————————————————————————————————————
const {
  toLower
} = require('lodash')
const mongoose = require('mongoose')

const ids = require('../schemas/Identifiers')
const Validation = require('../schemaValidators')

//———————————————————————————————————————————————————————————————
// Custom schema definition
//———————————————————————————————————————————————————————————————
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
    required: true,
    lowercase: true,
    validate: {
      validator: Validation.isEmail,
      message: '{VALUE} is not a valid e-mail'
    }
  },

  // Time when this contact was successfully published on RUDI portal
  publishedAt: {
    type: Date
  }
}, {
  timestamps: true,
  // optimisticConcurrency: true,
  // strict: true,
});


//———————————————————————————————————————————————————————————————
// Schema refinements
//———————————————————————————————————————————————————————————————

//----- toJSON cleanup
ContactSchema.methods.toJSON = function () {
  var contact = this.toObject()
  // metadata[API_METAINFO_PROPERTY][API_METAINFO_DATES_PROPERTY][API_DATES_CREATED_PROPERTY] = metadata.createdAt
  // metadata[API_METAINFO_PROPERTY][API_METAINFO_DATES_PROPERTY][API_DATES_EDITED_PROPERTY] = metadata.updatedAt
  delete contact._id
  delete contact.__v
  delete contact.createdAt
  delete contact.updatedAt
  delete contact.publishedAt
  return contact
};

//———————————————————————————————————————————————————————————————
// Exports
//———————————————————————————————————————————————————————————————
module.exports = mongoose.model('Contact', ContactSchema)