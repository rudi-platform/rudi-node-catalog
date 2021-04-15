'use strict';

//---------------------------------------------------------------
// External dependancies
//---------------------------------------------------------------
const mongoose = require('mongoose');
const Int32 = require('mongoose-int32');

const Ids = require('../schemas/Identifiers');
const Validation = require('../schemaValidators');

const MediaTypes = require('../thesaurus/MediaTypes');

const Encodings = require('../thesaurus/Encodings');
const FileTypes = require('../thesaurus/FileTypes');
const HashAlgorithms = require('../thesaurus/HashAlgorithms');

//---------------------------------------------------------------
// Constants
//---------------------------------------------------------------
const UpdateStatus = [
  'modified', // the data is in the process of being created but still incomplete
  'updated', // the data is up to date
  'historical', // ancient data that has been updated
  'obsolete', // dataset that is too old but cannot be updated or replaced with another
];

const options = {
  discriminatorKey: 'media_type',
  timestamps: true,
  id: false,
};

//---------------------------------------------------------------
// Media schema definition
//---------------------------------------------------------------

const MediaSchema = new mongoose.Schema({
  // Unique and permanent identifier for the organization in RUDI 
  // system (required)
  media_id: Ids.UUIDv4,

  // Updated offical name of the organization
  media_type: {
    type: String,
    enum: Object.values(MediaTypes),
    required: true
  },

  // Updated name of the service, or possibly the person
  connector: {
    url: {
      type: String,
      required: true
    },
    // TODO: define this properly. 
    // Most likely an enum defined in Rudi that can be handled in 
    // a known manner
    interface_contract: String
  },
}, options);

//---------------------------------------------------------------
// File schema definition
//---------------------------------------------------------------
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
      type: String,
      enum: Object.values(HashAlgorithms),
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
    enum: Object.values(Encodings),
    default: Encodings.Unicode
  },

  // Relevance status of the data
  //   - 'modified'   = the data is in the process of being created
  //                    but still incomplete
  //   - 'updated'    = the data is up to date
  //   - 'historical' = ancient data that has been updated
  //   - 'obsolete'   = dataset that is too old but cannot be updated 
  //                    or replaced with another
  update_status: {
    type: String,
    enum: Object.values(UpdateStatus)
  },

}, options);

//---------------------------------------------------------------
// Series schema definition
//---------------------------------------------------------------
const SeriesSchema = new mongoose.Schema({

  // Theorical delay between the production of the record and its availability,
  // in milliseconds.
  latency: {
    type: Int32,
    minimum: 0
  },

  // Theorical delay between the production of two records, in milliseconds.
  period: {
    type: Int32,
    minimum: 0
  },

  // Actual number of records
  current_number_of_records: {
    type: Int32,
    minimum: 0
  },

  // Actual size of the data, in bytes (refreshed automatically)
  current_size: {
    type: Int32,
    minimum: 0
  },

  // Estimated total number of records
  total_number_of_records: {
    type: Int32,
    minimum: 0
  },

  // Estimated total size of the data, in bytes 
  total_size: {
    type: Int32,
    minimum: 0
  },

}, options);

//---------------------------------------------------------------
// Schema refinements
//---------------------------------------------------------------

//----- toJSON cleanup
[MediaSchema, FileSchema, SeriesSchema]
.map(mediaType =>
  mediaType.methods.toJSON = function () {
    var obj = this.toObject()
    delete obj._id
    delete obj.__v
    delete obj.createdAt
    delete obj.updatedAt
    return obj
  })


//---------------------------------------------------------------
// Models definition
//---------------------------------------------------------------
const Media = mongoose.model('Media', MediaSchema)

const MediaFile = Media.discriminator('FILE', FileSchema)
const MediaSeries = Media.discriminator('SERIES', SeriesSchema)

//---------------------------------------------------------------
// Exports
//---------------------------------------------------------------
module.exports = {
  Media,
  MediaFile,
  MediaSeries
}