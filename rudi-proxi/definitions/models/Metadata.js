'use strict';
const mod = 'metaSch'
//———————————————————————————————————————————————————————————————
// API version
//———————————————————————————————————————————————————————————————
const {
  API_VERSION
} = require('../../config/confApi');

//———————————————————————————————————————————————————————————————
// External dependencies
//———————————————————————————————————————————————————————————————
const boom = require('@hapi/boom')
const mongoose = require('mongoose');

const Int32 = require('mongoose-int32');

//———————————————————————————————————————————————————————————————
// Internal dependencies
//———————————————————————————————————————————————————————————————
const db = require('../../db/dbQueries')
const {
  API_ORGANIZATION_ID,
  API_CONTACT_ID,
  DB_ID,
  API_METAINFO_PROPERTY,
  API_METAINFO_DATES_PROPERTY,
  API_DATES_CREATED_PROPERTY,
  API_DATES_EDITED_PROPERTY
} = require('../../db/dbFields');

const log = require('../../utils/logging')
const msg = require('../../utils/msg')
const json = require('../../utils/jsonAccess');

const Validation = require('../schemaValidators');

//———————————————————————————————————————————————————————————————
// Schema definitions
//———————————————————————————————————————————————————————————————
const GeoJSON = require('mongoose-geojson-schema');

const {
  DOI,
  UUIDv4
} = require('../schemas/Identifiers');
const DictionaryEntry = require('../schemas/DictionaryEntry');
const SkosEntry = require('../schemas/SkosEntry');
const AccessCondition = require('../schemas/AccessCondition');
const ReferenceDates = require('../schemas/ReferenceDates');

const Media = require('./Media');

//———————————————————————————————————————————————————————————————
// Model definitions
//———————————————————————————————————————————————————————————————
const Organization = require('./Organization');
const Contact = require('./Contact');

//———————————————————————————————————————————————————————————————
// Thesaurus definiitons
//———————————————————————————————————————————————————————————————
const Language = require('../thesaurus/Languages');
const Keywords = require('../thesaurus/Keywords');
const Themes = require('../thesaurus/Themes');
const Projection = require('../thesaurus/Projections');
const Encoding = require('../thesaurus/Encodings');
const HashAlgo = require('../thesaurus/HashAlgorithms');


//———————————————————————————————————————————————————————————————
// Constants
//———————————————————————————————————————————————————————————————
const UpdateStatus = {
  modified: 'modified',
  updated: 'updated',
  historical: 'historical',
  obsolete: 'obsolete'
};

const StorageStatus = {
  online: 'online',
  archived: 'archived',
  unavailable: 'unavailable'
};

const HashAlgorithms = {
  MD5: 'MD5',
  SHA256: 'SHA-256',
  SHA512: 'SHA-512'
};

const TransmissionModes = {
  file: 'FILE',
  series: 'SERIES'
};


//———————————————————————————————————————————————————————————————
// Custom schema definitions
//———————————————————————————————————————————————————————————————
const MetadataSchema = new mongoose.Schema({

  //---------------------------
  // Resource identifiers
  //---------------------------

  // Unique and permanent identifier for the ressource in RUDI system (required)
  global_id: UUIDv4,

  // Identifier for the ressource in the producer system (optional)
  local_id: {
    type: String,
    trim: true,
    unique: true
  },

  // Digital Object Identifier for the ressource (optional)
  doi: DOI,

  //---------------------------
  // Dataset description
  //---------------------------

  // Simple name for the resource
  resource_title: {
    type: String,
    maxlength: 150,
    required: true
  },

  // Short description for the whole dataset
  synopsis: {
    type: [DictionaryEntry],
    required: true,
  },

  // More precise description for the whole dataset
  summary: {
    type: [DictionaryEntry],
    required: true
  },
 
  //---------------------------
  // Dataset classification
  //---------------------------

  // Category for thematic classification of the data
  theme: {
    type: String,
    enum: Object.values(Themes),
    required: true
  },

  // List of tags that can be used to retrieve the data
  keywords: {
    type: [{
      type: String,
      enum: Object.values(Keywords)
    }],
    required: true
  },

  //---------------------------
  // Involved parties
  //---------------------------

  // Entity that produced the resource
  producer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },

  // Persons in charge of maintaining the resource
  contacts: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
    }],
    minlength: 1,
    required: true
  },

  //---------------------------
  // Container description
  //---------------------------

  available_formats: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Media'
    }],
    required: true
  },

  //---------------------------
  // Dataset info
  //---------------------------

  // Language used in the dataset, if relevant
  resource_languages: {
    type: [{
      type: String,
      enum: Object.values(Language)
    }],
    default: [Language.fr],
  },

  // Period of time described by the data
  temporal_spread: {
    start_date: {
      type: Date,
      required: true
    },
    end_date: {
      type: Date
    }
  },

  // Geographic distribution of the data. Particularly relevant in the case of located sensors.
  geography: {

    // Geographic distribution of the data as a rectangle.
    // The 4 parameters are given as decimal as described in the
    // norm ISO 6709
    bounding_box: {
      type: Object,
      required: true,

      // Northernmost latitude given as a decimal number
      north_latitude: {
        type: Number,
        min: -90,
        max: 90,
      },
      // Southernmost latitude given as a decimal number
      south_latitude: {
        type: Number,
        min: -90,
        max: 90,
      },
      // Westernmost latitude given as a decimal number
      west_longitude: {
        type: Number,
        min: -180,
        max: 180,
      },
      // Easternmost latitude given as a decimal number
      east_longitude: {
        type: Number,
        min: -180,
        max: 180,
      },
    },

    // Precise geographic distribution of the data 
    geographic_distribution: {
      type: mongoose.SchemaTypes.GeoJSON
    },

    // Cartographic projection used to describe the data
    projection: {
      type: String,
      enum: Object.values(Projection)
    },

    // Data topology
    spatial_representation: {
      type: String
    },

  },

  // Indicative total size of the data
  dataset_size: {
    numbers_of_records: {
      type: Int32,
      min: 0
    },
    number_of_fields: {
      type: Int32,
      min: 0
    },
  },

  // Dates of the actions performed on the data (creation, publishing, update, deletion...)
  dataset_dates: {
    type: ReferenceDates,
    required: true
  },

  // Status of the storage of the dataset
  // Metadata can exist without the data
  //   - online = data are published and available 
  //   - archived = data are not immediately available, access is not automatic 
  //   - unavailable = data were deleted
  storage_status: {
    type: Object.values(StorageStatus)
  },

  // Metadata on the metadata
  medatata_info: {

    // API version number (used for retro-compatibility)
    api_version: {
      type: String,
      required: true,
      validate: {
        validator: Validation.isVersion,
        message: '{VALUE} does not appear to be a valid version number (0.0.0abc)'
      }
    },

    // Dates of the actions performed on the metadata (creation, publishing, update...)
    metadata_dates: {
      type: ReferenceDates,
      required: true
    },

    // Description of the organization that produced the metadata
    metadata_provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
    },

    // Addresses to get further information on the metadata
    metadata_contacts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
    }]
  },
  // Time when this orgnization was published on RUDI portal
  publishedAt: {
    type: Date
  }
}, {
  timestamps: true,
  optimisticConcurrency: true,
  useNestedStrict: true,
  // toObject: {
  //   getters: true,
  //   setters: true,
  //   virtuals: false
  // },
  // toJSON: {
  //   getters: true,
  //   setters: true,
  //   virtuals: true
  // },
});


//———————————————————————————————————————————————————————————————
// Schema refinements
//———————————————————————————————————————————————————————————————

//----- toJSON cleanup
MetadataSchema.methods.toJSON = function () {
  var metadata = this.toObject()
  // metadata[API_METAINFO_PROPERTY][API_METAINFO_DATES_PROPERTY][API_DATES_CREATED_PROPERTY] = metadata.createdAt
  // metadata[API_METAINFO_PROPERTY][API_METAINFO_DATES_PROPERTY][API_DATES_EDITED_PROPERTY] = metadata.updatedAt
  delete metadata._id
  delete metadata.__v
  delete metadata.createdAt
  // delete metadata.updatedAt
  return metadata
};

//----- Virtuals
MetadataSchema.virtual('metadata_dates.created').get(function () {
  return this.createdAt;
});
MetadataSchema.virtual('metadata_dates.updated').get(function () {
  return this.updatedAt;
});


//———————————————————————————————————————————————————————————————
// Exports
//———————————————————————————————————————————————————————————————
module.exports = mongoose.model('Metadata', MetadataSchema);