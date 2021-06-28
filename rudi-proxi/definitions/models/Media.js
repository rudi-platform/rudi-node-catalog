'use strict'

const mod = 'mediaSch'

// -----------------------------------------------------------------------------
// External dependancies
// -----------------------------------------------------------------------------
const mongoose = require('mongoose')
const Int32 = require('mongoose-int32')
const _ = require('lodash')

// -----------------------------------------------------------------------------
// Internal dependancies
// -----------------------------------------------------------------------------
const log = require('../../utils/logging')
const Ids = require('../schemas/Identifiers')
const Validation = require('../schemaValidators')

const Encodings = require('../thesaurus/Encodings')
const FileTypes = require('../thesaurus/FileTypes').get()
const HashAlgorithms = require('../thesaurus/HashAlgorithms').get()

const {
  FIELDS_TO_SKIP,
  API_MEDIA_TYPE_PROPERTY,
  API_MEDIA_CHECKSUM_PROPERTY,
} = require('../../db/dbFields')
const { isNotEmptyObject } = require('../../utils/jsUtils')
const { missingObjectProperty, missingField } = require('../../utils/msg')

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const MediaTypes = {
  File: 'FILE',
  Series: 'SERIES',
}

const UpdateStatus = [
  'modified', // the data is in the process of being created but still incomplete
  'updated', // the data is up to date
  'historical', // ancient data that has been updated
  'obsolete', // dataset that is too old but cannot be updated or replaced with another
]

const InterfaceContract = {
  Dwnl: 'dwnl'
}

const commonSchemaOptions = {
  discriminatorKey: 'media_type',
  timestamps: true,
  id: false,
} 

// -----------------------------------------------------------------------------
// Media schema definition
// -----------------------------------------------------------------------------

const MediaSchema = new mongoose.Schema(
  {
    // Unique and permanent identifier for the organization in RUDI
    // system (required)
    media_id: Ids.UUIDv4,

    // Updated offical name of the organization
    media_type: {
      type: String,
      enum: Object.values(MediaTypes),
      required: true,
    },

    media_name: {
      type: String,
    },

    // Updated name of the service, or possibly the person
    connector: {
      url: {
        type: String,
        required: true,
      },
      // TODO: define this properly.
      // Most likely an enum defined in Rudi that can be handled in
      // a known manner
      interface_contract: {
        type: String,
        required: true,
        default: InterfaceContract.Dwnl,
      },
    },
  },
  commonSchemaOptions
)

MediaSchema.pre('save', function (next) {
  const fun = 'pre save hook'
  log.d(mod, fun, ``)
  if (
    this[API_MEDIA_TYPE_PROPERTY] === MediaTypes.File &&
    !isNotEmptyObject(this[API_MEDIA_CHECKSUM_PROPERTY])
  ) {
    next(new Error(missingField(API_MEDIA_CHECKSUM_PROPERTY)))
  } else next()
})

// -----------------------------------------------------------------------------
// File schema definition
// -----------------------------------------------------------------------------
const FileSchema = new mongoose.Schema(
  {
    // Native format of the resource
    file_type: {
      type: String,
      enum: Object.values(FileTypes),
      required: true,
    },

    // Size of the file, in bytes
    file_size: {
      type: Int32,
      required: true,
    },

    // Makes it possible to check data integrity
    checksum: {
      type: {
        algo: {
          type: String,
          enum: Object.values(HashAlgorithms),
          require: true,
        },
        hash: {
          type: String,
          require: true,
        },
      },
      require: true,
    },

    // Link towards the resource that describes the structure of the data
    // (language, norm, data structure, JSON schema, OpenAPI, etc.)
    file_structure: {
      type: String,
      match: Validation.URI,
    },

    // Source encoding of the data
    file_encoding: {
      type: String,
      enum: Object.values(Encodings.get()),
      default: Encodings.Unicode,
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
      enum: Object.values(UpdateStatus),
    },
  },
  commonSchemaOptions
)

FileSchema.pre('save', function (next) {
  const fun = 'pre save hook'
  log.d('FileSchema', fun, ``)
  if (!isNotEmptyObject(this[API_MEDIA_CHECKSUM_PROPERTY])) {
    next(new Error(missingField(API_MEDIA_CHECKSUM_PROPERTY)))
  } else {
    next()
  }
})

// -----------------------------------------------------------------------------
// Series schema definition
// -----------------------------------------------------------------------------
const SeriesSchema = new mongoose.Schema(
  {
    // Theorical delay between the production of the record and its availability,
    // in milliseconds.
    latency: {
      type: Int32,
      minimum: 0,
    },

    // Theorical delay between the production of two records, in milliseconds.
    period: {
      type: Int32,
      minimum: 0,
    },

    // Actual number of records
    current_number_of_records: {
      type: Int32,
      minimum: 0,
    },

    // Actual size of the data, in bytes (refreshed automatically)
    current_size: {
      type: Int32,
      minimum: 0,
    },

    // Estimated total number of records
    total_number_of_records: {
      type: Int32,
      minimum: 0,
    },

    // Estimated total size of the data, in bytes
    total_size: {
      type: Int32,
      minimum: 0,
    },
  },
  commonSchemaOptions
)

// -----------------------------------------------------------------------------
// Schema refinements
// -----------------------------------------------------------------------------

// ----- toJSON cleanup
MediaSchema.methods.toJSON = function () {
  return _.omit(this.toObject(), FIELDS_TO_SKIP)
}
FileSchema.methods.toJSON = function () {
  return _.omit(this.toObject(), FIELDS_TO_SKIP)
}
SeriesSchema.methods.toJSON = function () {
  return _.omit(this.toObject(), FIELDS_TO_SKIP)
}

// -----------------------------------------------------------------------------
// Models definition
// -----------------------------------------------------------------------------
const Media = mongoose.model('Media', MediaSchema)
const MediaFile = Media.discriminator(MediaTypes.File, FileSchema)
const MediaSeries = Media.discriminator(MediaTypes.Series, SeriesSchema)

// -----------------------------------------------------------------------------
// Exports
// -----------------------------------------------------------------------------
module.exports = {
  Media,
  MediaFile,
  MediaSeries,
  MediaTypes,
  InterfaceContract
}
