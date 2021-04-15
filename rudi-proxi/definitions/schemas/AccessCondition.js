'use strict';


//---------------------------------------------------------------
// External dependencies
//---------------------------------------------------------------
const mongoose = require('mongoose');

//---------------------------------------------------------------
// Schema definitions
//---------------------------------------------------------------
const Validation = require('../schemaValidators');
const DictionaryEntry = require('./DictionaryEntry')

//---------------------------------------------------------------
// Model definitions
//---------------------------------------------------------------
const Licence = require('../models/Licence');

//---------------------------------------------------------------
// Custom schema definition: AccessCondition
//---------------------------------------------------------------

/**
 * Access restrictions for the use of data in the form of licence,
 * confidentiality, terms of service, habilitation or required rights,
 * economical model. 
 * Default is open licence.
 */
exports.AccessCondition = {

  /** Restriction level for the resource */
  confidentiality: {
    type: {
      /**
       * True if the dataset has a restricted access. 
       * False for open data 
       * */
      restricted_access: Boolean,

      /** True if the dataset embeds personal data */
      gdpr_sensitive: Boolean
    },
    required: true
  },

  licence: {
    type: Licence,
    required: true
  },

  /** Describes how constrained is the use of the resource */
  usage_constraint: {
    type: [DictionaryEntry]
  },

  /** Information that MUST be cited every time the data is used */
  bibliographical_reference: {
    type: [DictionaryEntry]
  },

  // Mention that must be cited verbatim in every publication that
  // makes use of the data
  mandatory_mention: {
    type: [DictionaryEntry]
  },

  access_constraint: {
    type: [DictionaryEntry]
  },

  other_constraints: {
    type: [DictionaryEntry]
  }
}