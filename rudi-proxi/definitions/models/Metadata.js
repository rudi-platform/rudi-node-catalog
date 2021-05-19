'use strict'

const mod = 'metaSch'

// ---------------------------------------------------------------
// External dependencies
// ---------------------------------------------------------------
const mongoose = require('mongoose')
const _ = require('lodash')

// eslint-disable-next-line no-unused-vars
const GeoJSON = require('mongoose-geojson-schema')
const Int32 = require('mongoose-int32')

// ---------------------------------------------------------------
// Internal dependencies
// ---------------------------------------------------------------
const {
  API_DATA_PRODUCER_PROPERTY,
  API_DATA_CONTACTS_PROPERTY,

  API_METADATA_ACCESS_CONDITION,
  API_METADATA_LICENCE,
  API_METADATA_LICENCE_TYPE,
  API_METADATA_LICENCE_LABEL,
  API_METADATA_LICENCE_CUSTOM_LABEL,
  API_METADATA_LICENCE_CUSTOM_URI,

  API_METADATA_GEOGRAPHY_PROPERTY,
  API_METADATA_BBOX_PROPERTY,
  API_METADATA_GEO_PROJECTION_PROPERTY,
  API_METADATA_PERIOD_PROPERTY,
  API_METADATA_START_DATE_PROPERTY,

  API_METAINFO_PROPERTY,
  API_METAINFO_CONTACTS_PROPERTY,
  API_METAINFO_PROVIDER_PROPERTY,
  API_METAINFO_DATES_PROPERTY,

  API_DATES_CREATED_PROPERTY,
  API_DATES_EDITED_PROPERTY,
  API_DATES_PUBLISHED_PROPERTY,

  API_MEDIA_PROPERTY,

  FIELDS_TO_SKIP,
  API_DATA_DATES_PROPERTY
} = require('../../db/dbFields')

const log = require('../../utils/logging')
const msg = require('../../utils/msg')
const json = require('../../utils/jsonAccess')
const utils = require('../../utils/jsUtils')

const Validation = require('../schemaValidators')

// ---------------------------------------------------------------
// Schema definitions
// ---------------------------------------------------------------

/* beautify ignore:start */
const { DOI, UUIDv4 } = require('../schemas/Identifiers')
/* beautify ignore:end */
const DictionaryEntry = require('../schemas/DictionaryEntry')
const ReferenceDates = require('../schemas/ReferenceDates')

// ---------------------------------------------------------------
// Model definitions
// ---------------------------------------------------------------
const Licence = require('./Licence')

// ---------------------------------------------------------------
// Other controllers
// ---------------------------------------------------------------
const licenceController = require('../../controllers/licenceController')

// ---------------------------------------------------------------
// Thesaurus definiitons
// ---------------------------------------------------------------
const Languages = require('../thesaurus/Languages')
const Keywords = require('../thesaurus/Keywords')
const Themes = require('../thesaurus/Themes')
const Projections = require('../thesaurus/Projections')
const StorageStatus = require('../thesaurus/StorageStatus')

// ---------------------------------------------------------------
// Validators
// ---------------------------------------------------------------
const validArrayNotNull = {
  validator: utils.isNotEmptyArray,
  message: `'{PATH}' property should not be empty`
}
const validObjectNotEmpty = {
  validator: utils.isNotEmptyObject,
  message: `'{PATH}' property should not be empty`
}

// ---------------------------------------------------------------
// Fields with specific treatments
// ---------------------------------------------------------------
const METADATA_FIELDS_TO_POPULATE = [
  API_DATA_PRODUCER_PROPERTY,
  API_DATA_CONTACTS_PROPERTY,
  `${API_METAINFO_PROPERTY}.${API_METAINFO_PROVIDER_PROPERTY}`,
  `${API_METAINFO_PROPERTY}.${API_METAINFO_CONTACTS_PROPERTY}`,
  API_MEDIA_PROPERTY
].join(' ')

const SKIP_FIELDS = `-${FIELDS_TO_SKIP.join(' -')}`

const POPULATE_OPTS = {
  path: METADATA_FIELDS_TO_POPULATE,
  select: SKIP_FIELDS
}

// ---------------------------------------------------------------
// Custom schema definitions
// ---------------------------------------------------------------
const MetadataSchema = new mongoose.Schema({

  // ---------------------------
  // Resource identifiers
  // ---------------------------

  /** Unique and permanent identifier for the ressource in RUDI system (required) */
  global_id: UUIDv4,

  /** Identifier for the ressource in the producer system (optional) */
  local_id: {
    type: String,
    trim: true,
    index: {
      unique: true,
      // accept empty values as non-duplicates
      partialFilterExpression: {
        local_id: {
          $type: 'string'
        }
      }
    }
  },

  // Digital Object Identifier for the ressource (optional)
  doi: DOI,

  // ---------------------------
  // Dataset description
  // ---------------------------

  /** Simple name for the resource */
  resource_title: {
    type: String,
    maxlength: 150,
    required: true
  },

  /** Short description for the whole dataset */
  synopsis: {
    type: [DictionaryEntry],
    required: true,
    validate: validArrayNotNull
  },

  /** More precise description for the whole dataset */
  summary: {
    type: [DictionaryEntry],
    required: true,
    validate: validArrayNotNull
  },

  /** Context, objectives and final use of the data */
  purpose: {
    type: [DictionaryEntry]
  },

  // ---------------------------
  // Dataset classification
  // ---------------------------

  /** Category for thematic classification of the data */
  theme: {
    type: String,
    // enum: Object.values(Themes),
    required: true
  },

  /** List of tags that can be used to retrieve the data */
  keywords: {
    type: [{
      type: String
      // ,enum: Object.values(Keywords)
    }],
    required: true,
    validate: validArrayNotNull
  },

  /** Tag for identifying a collection of resources */
  collection_tag: {
    type: String
  },

  // ---------------------------
  // Involved parties
  // ---------------------------

  /** Entity that produced the resource */
  producer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },

  /** Persons in charge of maintaining the resource */
  contacts: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact'
    }],
    required: true,
    validate: validArrayNotNull
  },

  // ---------------------------
  // Container description
  // ---------------------------

  /** List of files containing the data */
  available_formats: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Media'
    }],
    required: true,
    validate: validArrayNotNull
  },

  // ---------------------------
  // Dataset info
  // ---------------------------

  /** Language used in the dataset, if relevant */
  resource_languages: {
    type: [{
      type: String
      // ,enum: Object.values(Languages)
    }],
    default: [Languages.fr]
  },

  /** Period of time described by the data */
  temporal_spread: {
    start_date: {
      type: Date
      // Custom validation in pre-save hook: required if 'temporal_spread' is defined !
    },
    end_date: {
      type: Date
    }
  },

  /**
   * Geographic distribution of the data.
   * Particularly relevant in the case of located sensors.
   */
  geography: {

    /**
     * Geographic distribution of the data as a rectangle.
     * The 4 parameters are given as decimal as described in the norm ISO 6709
     */
    bounding_box: {
      type: Object,
      // Custom validation in pre-save hook: required if 'geography' is defined !

      /** Westernmost latitude given as a decimal number */
      west_longitude: {
        type: Number,
        min: -180,
        max: 180
      },
      /* Easternmost latitude given as a decimal number */
      east_longitude: {
        type: Number,
        min: -180,
        max: 180
      },
      /** Southernmost latitude given as a decimal number */
      south_latitude: {
        type: Number,
        min: -90,
        max: 90
      },
      /** Northernmost latitude given as a decimal number */
      north_latitude: {
        type: Number,
        min: -90,
        max: 90
      }
    },

    /**
     * Precise geographic distribution of the data
     *
     * Précisions: GeoJSON uses a geographic coordinate reference system,
     * World Geodetic System 1984, and units of decimal degrees.
     * The first two elements are longitude and latitude, or easting and
     * northing, precisely in that order and using decimal numbers.
     * Altitude or elevation MAY be included as an optional third element.
     *
     * Source: https://tools.ietf.org/html/rfc7946#section-3.1.1
     */
    geographic_distribution: {
      type: mongoose.SchemaTypes.GeoJSON
    },

    /**
     * Cartographic projection used to describe the data
     */
    projection: {
      type: String
      // ,enum: Object.values(Projections)
      // default: 'WGS 84'
    },

    /**
     * Data topology
     */
    spatial_representation: {
      type: String
    }

  },

  /**
   * Indicative total size of the data
   */
  dataset_size: {
    numbers_of_records: {
      type: Int32,
      min: 0
    },
    number_of_fields: {
      type: Int32,
      min: 0
    }
  },

  /**
   * Dates of the actions performed on the data (creation, publishing, update, deletion...)
   */
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
    type: String,
    // enum: Object.values(StorageStatus),
    required: true
  },

  access_condition: {
    required: true,
    validate: validObjectNotEmpty,
    type: {
      /** Restriction level for the resource */
      confidentiality: {
        /**
         * True if the dataset has a restricted access.
         * False for open data
         * */
        restricted_access: {
          type: Boolean,
          default: false
        },

        /** True if the dataset embeds personal data */
        gdpr_sensitive: {
          type: Boolean,
          default: false
        }
      },

      /**
       * Standard license (recognized by RUDI system)
       */
      licence: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Licence',
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

      /**
       * Mention that must be cited verbatim in every publication that
       * makes use of the data
       */
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
  },

  /** Metadata on the metadata */
  metadata_info: {

    /** API version number (used for retro-compatibility) */
    api_version: {
      type: String,
      required: true,
      match: Validation.API_VERSION
    },

    /** Dates of the actions performed on the metadata (creation, publishing, update...) */
    metadata_dates: {
      validated: {
        type: Date
      },
      deleted: {
        type: Date
      }
    },

    /** Description of the organization that produced the metadata */
    metadata_provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization'
    },

    /** Addresses to get further information on the metadata */
    metadata_contacts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact'
    }]
  },

  /** Date when the resource has been successfully integrated on Rudi Portal for the first time */
  publishedAt: {
    type: Date
  }
}, {
  timestamps: true,
  id: false,
  optimisticConcurrency: true,
  useNestedStrict: true,
  toObject: {
    getters: true,
    setters: true,
    virtuals: true
  },
  toJSON: {
    getters: true,
    setters: true,
    virtuals: true
  }
})

// ---------------------------------------------------------------
// Validation
// ---------------------------------------------------------------
async function checkLicence(metadata) {
  const fun = 'checkLicence'

  const accessCondition = json.accessProperty(metadata, API_METADATA_ACCESS_CONDITION)
  // log.d(mod, fun, `accessCondition: ${utils.beautify(accessCondition)}`)
  const licence = json.requireSubProperty(metadata, API_METADATA_ACCESS_CONDITION, API_METADATA_LICENCE)
  // log.d(mod, fun, `licence: ${utils.beautify(licence)}`)

  const licenceType = json.requireSubProperty(accessCondition, API_METADATA_LICENCE, API_METADATA_LICENCE_TYPE)

  switch (licenceType) {
    case Licence.LicenceTypes.Standard: {
      // log.d(mod, fun, `licenceType: ${utils.beautify(licenceType)}`)
      const licenceLabel = json.requireSubProperty(accessCondition, API_METADATA_LICENCE, API_METADATA_LICENCE_LABEL,
        API_METADATA_LICENCE_TYPE, Licence.LicenceTypes.Standard)
      const listLicenceCode = await licenceController.getLicenceCodes()
      // log.d(mod, fun, `licence list: ${utils.beautify(listLicenceCode)}`)
      if (listLicenceCode.indexOf(licenceLabel) === -1) {
        throw (new Error(`Licence label '${licenceLabel}' was not found in licence list '${listLicenceCode}'`))
      } else {
        return licenceLabel
      }
    }
    case Licence.LicenceTypes.Custom: {
      // log.d(mod, fun, `licenceType: ${utils.beautify(licenceType)}`)
      json.requireSubProperty(accessCondition, API_METADATA_LICENCE, API_METADATA_LICENCE_CUSTOM_LABEL,
        API_METADATA_LICENCE_TYPE, Licence.LicenceTypes.Custom)
      json.requireSubProperty(accessCondition, API_METADATA_LICENCE, API_METADATA_LICENCE_CUSTOM_URI,
        API_METADATA_LICENCE_TYPE, Licence.LicenceTypes.Custom)
      return licence[API_METADATA_LICENCE_CUSTOM_LABEL]
    }
    default: {
      const errMsg =
        msg.incorrectValueForEnum(`${API_METADATA_ACCESS_CONDITION}.${API_METADATA_LICENCE}.${API_METADATA_LICENCE_TYPE}`, licenceType)
      log.e(mod, fun, errMsg)
      throw new Error(errMsg)
    }
  }
}

async function checkThesaurus(metadata, next) {
  const fun = 'checkThesaurus'
  if (metadata.init) log.d(mod, fun, `init`)
  const init = metadata.init

  try {
    if (Themes.isValid(metadata.theme, init)) next()
    next(new Error(msg.incorrectVal('theme', metadata.theme)))

    await Promise.all(metadata.keywords.map(
      keyword => {
        if (Keywords.isValid(keyword, init)) next()
        else next(new Error(msg.incorrectVal('keywords', keyword)))
        return true
      }
    ))

    if (metadata.resource_languages) {
      await Promise.all(metadata.resource_languages.map(
        lang => {
          if (Languages.isValid(lang, init)) next()
          else next(new Error(msg.incorrectVal('resource_languages', lang)))
          return true
        }
      ))
    }

    if (metadata.geography && metadata.geography.projection) {
      if (Projections.isValid(metadata.geography.projection, init)) next()
      else next(new Error(msg.incorrectVal('geography.projection', metadata.geography.projection)))
    }

    if (StorageStatus.isValid(metadata.storage_status, init)) next()
    else next(new Error(msg.incorrectVal('storage_status', metadata.storage_status)))
  } catch (err) {
    log.w(mod, fun, err)
    next(err)
  }
}

// ---------------------------------------------------------------
// Schema refinements
// ---------------------------------------------------------------

// ----- toJSON cleanup
MetadataSchema.methods.toJSON = function () {
  return _.omit(this.toObject(), FIELDS_TO_SKIP)
}

// ----- Virtuals
MetadataSchema.virtual(`${API_METAINFO_PROPERTY}.${API_METAINFO_DATES_PROPERTY}.${API_DATES_CREATED_PROPERTY}`).get(function () {
  return this.createdAt
})
MetadataSchema.virtual(`${API_METAINFO_PROPERTY}.${API_METAINFO_DATES_PROPERTY}.${API_DATES_EDITED_PROPERTY}`).get(function () {
  return this.updatedAt
})
MetadataSchema.virtual(`${API_METAINFO_PROPERTY}.${API_METAINFO_DATES_PROPERTY}.${API_DATES_PUBLISHED_PROPERTY}`).get(function () {
  return this.publishedAt
})

MetadataSchema.pre('save', async function (next) {
  const fun = 'pre save hook'
  log.d(mod, fun, ``)
  const metadata = this

  try {
    // If 'geography' field is defined, the field 'geography.bbox' is required
    if (json.requireSubProperty(metadata, API_METADATA_GEOGRAPHY_PROPERTY, API_METADATA_BBOX_PROPERTY)) {
      if (utils.isNothing(metadata[API_METADATA_GEOGRAPHY_PROPERTY][API_METADATA_GEO_PROJECTION_PROPERTY])) {
        // If 'geography' field is defined, but 'geography.projection' is not, it is initialized to the defaul value.
        metadata[API_METADATA_GEOGRAPHY_PROPERTY][API_METADATA_GEO_PROJECTION_PROPERTY] = 'WGS 84'
      }
    }

    // If 'temporal_spread' is defined, the field 'start_date' should be defined
    json.requireSubProperty(metadata, API_METADATA_PERIOD_PROPERTY, API_METADATA_START_DATE_PROPERTY)

    // Checking 'licence' field
    await checkLicence(metadata)

    // If 'dataset_dates.updated' is not defined, it is initialized with 'dataset_dates.created'
    if (utils.isNothing(metadata[API_DATA_DATES_PROPERTY][API_DATES_EDITED_PROPERTY])) {
      metadata[API_DATA_DATES_PROPERTY][API_DATES_EDITED_PROPERTY] = metadata[API_DATA_DATES_PROPERTY][API_DATES_CREATED_PROPERTY]
    }
  } catch (err) {
    next(err)
  }

  checkThesaurus(metadata, next)

  next()
})

MetadataSchema.post('save', async function (doc, next) {
  const fun = 'post save hook'
  log.d(mod, fun, ``)

  try {
    await this.populate(POPULATE_OPTS).execPopulate()
  } catch (err) {
    next(err)
  }
  next()
})

/*
MetadataSchema.post('find', async function (docs, next) {
  const fun = 'post find hook'
  log.d(mod, fun, ``)

  try {
    for (let doc of docs) {
      // if (doc.isPublic)
      await doc.populate(POPULATE_OPTS).execPopulate()
    }
  } catch (err) {
    next(err)
  }
  next()
})
 */

// ---------------------------------------------------------------
// Models definition
// ---------------------------------------------------------------
const Metadata = mongoose.model('Metadata', MetadataSchema)

// ---------------------------------------------------------------
// Exports
// ---------------------------------------------------------------
module.exports = {
  Metadata,
  METADATA_FIELDS_TO_POPULATE
}
