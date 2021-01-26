//———————————————————————————————————————————————————————————————
// External dependancies
//———————————————————————————————————————————————————————————————
const mongoose = require('mongoose')

const GeoJSON = require('mongoose-geojson-schema');

const Validation = require('../schemaValidators')

var Int32 = require('mongoose-int32');

//———————————————————————————————————————————————————————————————
// External schema definitions
//———————————————————————————————————————————————————————————————
const DictionaryEntry = require('../schemas/DictionaryEntry')
const SkosEntry = require('../schemas/SkosEntry')
const AccessCondition = require('../schemas/AccessCondition')
const ReferenceDates = require('../schemas/ReferenceDates')


//———————————————————————————————————————————————————————————————
// External model definitions
//———————————————————————————————————————————————————————————————
const Producer = require('./Producer');
const Contact = require('./Contact');

//———————————————————————————————————————————————————————————————
// Thesaurus definiitons
//———————————————————————————————————————————————————————————————
const Language = require('../thesaurus/Languages');
const Projection = require('../thesaurus/Projections');
const Encoding = require('../thesaurus/Encodings');
const HashAlgo = require('../thesaurus/HashAlgos');

//———————————————————————————————————————————————————————————————
// Constants
//———————————————————————————————————————————————————————————————
const RudiID = {
  type: String,
  trim: true,
  required: true,
  unique: true,
  dropDups: true,
  // index: true,
  lowercase: true,
  validate: {
    validator: Validation.isRudiID,
    message: '{VALUE} does not appear to be a valid RUDI ID (UUID v4)'
  }
}

const FileFormats = {
  json: 'json',
  xml: 'xml',
  csv: 'csv',
  xlsx: 'xlsx',
  txt: 'txt'
}

const UpdateStatus = {
  modified: 'modified',
  updated: 'updated',
  historical: 'historical',
  obsolete: 'obsolete'
}

const StorageStatus = {
  online: 'online',
  archived: 'archived',
  unavailable: 'unavailable'
}

const HashAlgorithms = {
  MD5: 'MD5',
  SHA256: 'SHA-256',
  SHA512: 'SHA-512'
}

const TransmissionModes = {
  file: 'file',
  stream: 'stream'
}

//———————————————————————————————————————————————————————————————
// Custom schema definitions
//———————————————————————————————————————————————————————————————
const MetadataSchema = new mongoose.Schema({
  // Unique and permanent identifier for the ressource in RUDI system (required)
  global_id: RudiID,

  // Identifier for the ressource in the producer system (optional)
  local_id: {
    type: String,
    trim: true,
    unique: true
  },

  // Digital Object Identifier for the ressource (optional)
  doi: {
    type: String,
    trim: true,
    unique: true,
    lowercase: true,
    validate: {
      validator: Validation.isDOI,
      message: '{VALUE} does not appear to be a valid DOI'
    }
  },

  // Simple name for the resource
  resource_title: String,

  // More precise description for the whole dataset
  summary: [DictionaryEntry],

  // Context, objectives and final use of the data
  purpose: String,

  // Language used in the dataset, if relevant
  resource_language: {
    type: String,
    default: Language.fr_FR,
    enum: Object.values(Language)
  },

  // Category for thematic classification of the data
  theme: {
    type: SkosEntry
  },

  // Sub-category for thematic classification of the data
  sub_theme: {
    type: SkosEntry
  },

  // List of tags that can be used to retrieve the data
  keyword: [SkosEntry],

  // Period of time described by the data
  lifespan: [Date],

  // Geographic distribution of the data. Particularly relevant in the case of located sensors.
  bounding_box: {
    type: mongoose.SchemaTypes.GeoJSON
  },

  // Spatial resolution, i.e. geographic or geometric precision used to describe the resource
  // scale: 

  // Cartographic projection used to describe the data
  projection: {
    type: String,
    enum: Object.values(Projection)
  },

  // Data topology
  spatial_representation: {
    type: String
  },

  // Information that describes the level of confidentiality required to access or use the data. 
  // This is a reference to the consent folder
  consent: {
    type: String
  },

  // Access restrictions for the use of data in the form of licence,
  // confidentiality, terms of service, habilitation or required rights,
  // economical model. Default is open licence.
  access_condition: {
    type: AccessCondition,
  },

  // Entity that produced the resource
  producer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Producer'
  },

  // Person in charge of maintaining the resource
  contact: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact'
  },

  // Sensor that was used to produce the resource (SenML definition)
  sensor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sensor'
  },

  // Link towards the resource that describes the structure of the data
  // (language, norm, data structure, JSON schema, OpenAPI, etc.)
  structure: {
    type: String,
    validate: {
      validator: Validation.isURI,
      message: '{VALUE} is not a valid URI'
    }
  },

  // Native format of the resource
  format: {
    type: String,
    enum: Object.values(FileFormats)
  },

  // Source encoding of the data
  encoding: {
    type: String,
    default: Encoding.Unicode,
    enum: Object.values(Encoding)
  },

  // Available alternative formats
  available_format: {
    type: [Object.values(FileFormats)]
  },

  dataset_size: {
    type: Object,
    size: {
      type: Number,
      min: 0
    },
    unit: {
      type: SkosEntry
    },
    numbers_of_records: {
      type: Int32,
      min: 0,
      max: 500
    },
    number_of_fields: {
      type: Int32,
      min: 0
    },
  },

  reference_date: {
    data: ReferenceDates,
    metadata: ReferenceDates
  },

  // Dependecies are other resources that were used as sources
  // for the present resource (parents) or that use the present 
  // resource as source (children) 
  dependencies: {
    // Resources that were used as sources by the present resource
    parents: [RudiID],

    // Resources that use the present resource as a source
    children: [RudiID]
  },

  // Method to anonymize data
  anonymization: {
    type: String,
    validate: {
      validator: Validation.isURI,
      message: '{VALUE} is not a valid URI'
    }
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

  // Status of the storage of the dataset
  // Metadata can exist without the data
  //   - online = data are published and available 
  //   - archived = data are not immediately available, access is not automatic 
  //   - unavailable = data were deleted
  storage_status: {
    type: [Object.values(StorageStatus)]
  },

  // Data specifications that apply to the resource
  conformance: {
    type: String,
    validate: {
      validator: Validation.isURI,
      message: '{VALUE} is not a valid URI'
    }
  },

  connector: {
    type: Object
  },

  // Makes it possible to check data integrity
  checksum: {
    algo: {
      type: [Object.values(HashAlgorithms)],
    },
    hash: {
      type: String,
    }
  },

  // Describes if the resource is accessible as a file or a stream
  transmission_mode: {
    type: [Object.values(TransmissionModes)]
  },

  // Theorical delay between the production of the record and its 
  // availability, in milliseconds. 
  // Applies to temporal series of data.
  latency: {
    type: Int32,
    min: 0
  },

  // Theorical delay between the production of two records, in 
  // milliseconds. Applies to temporal series of data.
  period: {
    type: Int32,
    min: 0
  },

})




//———————————————————————————————————————————————————————————————
// Exports
//———————————————————————————————————————————————————————————————
module.exports = mongoose.model('Metadata', MetadataSchema)