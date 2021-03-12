'use strict';

//———————————————————————————————————————————————————————————————
// External dependancies
//———————————————————————————————————————————————————————————————
const mongoose = require('mongoose')
const Int32 = require('mongoose-int32')

//———————————————————————————————————————————————————————————————
// Internal dependancies
//———————————————————————————————————————————————————————————————
const Ids = require('../schemas/Identifiers')
const Validation = require('../schemaValidators')
const Encodings = require('../thesaurus/Encodings')
const FileTypes = require('../thesaurus/FileTypes')
const HashAlgorithms = require('../thesaurus/HashAlgorithms')

//———————————————————————————————————————————————————————————————
// Constants
//———————————————————————————————————————————————————————————————
const UpdateStatus = [
  'modified',   // the data is in the process of being created but still incomplete
  'updated',    // the data is up to date
  'historical', // ancient data that has been updated
  'obsolete',   // dataset that is too old but cannot be updated or replaced with another
]


//———————————————————————————————————————————————————————————————
// Custom schema definition
//———————————————————————————————————————————————————————————————
const FileSchema = new mongoose.Schema({

  // Native format of the resource
  file_type: {
    type: String,
    enum: Object.values(FileTypes),
    required: true
  },

  // Size of the file, in bytes 
  file_size: {
    type: Int32,
    required: true
  },

  // Makes it possible to check data integrity
  checksum: {
    algo: {
      type: [Object.values(HashAlgorithms)],
      require: true
    },
    hash: {
      type: String,
      require: true
    }
  },

  // Link towards the resource that describes the structure of the data
  // (language, norm, data structure, JSON schema, OpenAPI, etc.)
  file_structure: {
    type: String,
    validate: {
      validator: Validation.isURI,
      message: '{VALUE} is not a valid URI'
    }
  },

  // Source encoding of the data
  file_encoding: {
    type: String,
    default: Encodings.Unicode,
    enum: Object.values(Encodings)
  },

  // Relevance status of the data
  //   - 'modified'   = the data is in the process of being created
  //                    but still incomplete
  //   - 'updated'    = the data is up to date
  //   - 'historical' = ancient data that has been updated
  //   - 'obsolete'   = dataset that is too old but cannot be updated 
  //                    or replaced with another
  update_status: {
    type: [Object.values(UpdateStatus)]
  },

})



//———————————————————————————————————————————————————————————————
// Exports
//———————————————————————————————————————————————————————————————
module.exports = FileSchema
  