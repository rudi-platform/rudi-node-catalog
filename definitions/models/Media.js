const mod = 'mediaSch'
// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import mongoose from 'mongoose'

import mongooseInt32 from 'mongoose-int32'
const Int32 = mongooseInt32.loadType(mongoose)

import sanitize from 'sanitize-filename'

import _ from 'lodash'
const { omit } = _

// -------------------------------------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------------------------------------
import {
  FIELDS_TO_SKIP,
  API_COLLECTION_TAG,
  API_MEDIA_ID,
  API_MEDIA_TYPE,
  API_MEDIA_NAME,
  API_MEDIA_CONNECTOR,
  API_MEDIA_INTERFACE_CONTRACT,
  API_FILE_MIME,
  API_FILE_SIZE,
  API_FILE_CHECKSUM,
  API_FILE_STRUCTURE,
  API_FILE_ENCODING,
  API_FILE_UPDATE_STATUS,
  API_MEDIA_CONNECTOR_PARAMS,
  API_MEDIA_CAPTION,
  API_MEDIA_DATES,
  API_MEDIA_URL_VISUAL,
} from '../../db/dbFields.js'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import ReferenceDatesSchema from '../schemas/ReferenceDates.js'
import { ConnectorParameter } from '../schemas/ConnectorParameters.js'

import { VALID_URI } from '../schemaValidators.js'
import { UuidV4Schema } from '../schemas/Identifiers.js'
import { isNotEmptyObject } from '../../utils/jsUtils.js'
import { logD, logV, logW } from '../../utils/logging.js'
import { missingField } from '../../utils/msg.js'
import { BadRequestError, RudiError } from '../../utils/errors.js'
import { makeSearchable } from '../../db/dbActions.js'

import { get as getEncodings } from '../thesaurus/Encodings.js'
import { getFileTypesWithCrypt } from '../thesaurus/FileTypes.js'
import { get as getHashAlgorithms } from '../thesaurus/HashAlgorithms.js'

// -------------------------------------------------------------------------------------------------
// Media constants
// -------------------------------------------------------------------------------------------------
export const MediaTypes = {
  File: 'FILE',
  Series: 'SERIES',
  Service: 'SERVICE',
}

export const UpdateStatus = [
  'modified', // the data is in the process of being created but still incomplete
  'updated', // the data is up to date
  'historical', // ancient data that has been updated
  'obsolete', // dataset that is too old but cannot be updated or replaced with another
]

export const InterfaceContract = {
  Dwnld: 'dwnl',
}

const commonSchemaOptions = {
  discriminatorKey: 'media_type',
  timestamps: true,
  id: false,
}

// -------------------------------------------------------------------------------------------------
// Media schema definition
// -------------------------------------------------------------------------------------------------

const MediaSchema = new mongoose.Schema(
  {
    /**
     * Unique and permanent identifier for the organization in RUDI
     * system (required)
     */
    [API_MEDIA_ID]: UuidV4Schema,

    /** Updated offical name of the organization */
    [API_MEDIA_TYPE]: {
      type: String,
      enum: Object.values(MediaTypes),
      required: true,
    },

    /** Original name of the file */
    [API_MEDIA_NAME]: String,

    /** Short description of the media */
    [API_MEDIA_CAPTION]: String,

    /** Time of the creation / last update of the Media */
    [API_MEDIA_DATES]: ReferenceDatesSchema,

    /** Link towards a (low-fidelity) visualization of the media */
    [API_MEDIA_URL_VISUAL]: {
      type: String,
      match: VALID_URI,
    },

    /** Updated name of the service, or possibly the person */
    [API_MEDIA_CONNECTOR]: {
      url: {
        type: String,
        required: true,
      },
      // TODO: define this properly.
      // Most likely an enum defined in Rudi that can be handled in
      // a known manner
      [API_MEDIA_INTERFACE_CONTRACT]: {
        type: String,
        required: true,
        default: InterfaceContract.Dwnld,
      },

      // Optional connector parameters
      [API_MEDIA_CONNECTOR_PARAMS]: {
        type: [ConnectorParameter],
        default: undefined,
      },
    },

    /** Tag for identifying a collection of resources */
    [API_COLLECTION_TAG]: {
      type: String,
    },
  },
  commonSchemaOptions
)

MediaSchema.pre('save', function (next) {
  const mod = 'MediaSchema'
  const fun = 'pre save hook'
  // logT(mod, fun, ``)
  try {
    if (this[API_MEDIA_TYPE] === MediaTypes.File && !isNotEmptyObject(this[API_FILE_CHECKSUM]))
      throw new BadRequestError(missingField(API_FILE_CHECKSUM))

    if (!!this[API_MEDIA_NAME]) {
      const nameBefore = this[API_MEDIA_NAME]
      const nameAfter = sanitize(this[API_MEDIA_NAME])
      if (nameBefore !== nameAfter) {
        this[API_MEDIA_NAME] = nameAfter
        logD(mod, fun, `sanitized: '${nameBefore}' -> '${nameAfter}'`)
      }
    }
    next()
  } catch (err) {
    logW(mod, fun, err)
    next(err)
  }
})

// -------------------------------------------------------------------------------------------------
// File schema definition
// -------------------------------------------------------------------------------------------------
const FileSchema = new mongoose.Schema(
  {
    // Native format of the resource
    [API_FILE_MIME]: {
      type: String,
      enum: Object.values(getFileTypesWithCrypt()),
      required: true,
    },

    // Size of the file, in bytes
    [API_FILE_SIZE]: {
      type: Int32,
      required: true,
    },

    // Makes it possible to check data integrity
    [API_FILE_CHECKSUM]: {
      algo: {
        type: String,
        enum: Object.values(getHashAlgorithms()),
        required: true,
      },
      hash: {
        type: String,
        required: true,
      },
    },

    // Link towards the resource that describes the structure of the data
    // (language, norm, data structure, JSON schema, OpenAPI, etc.)
    [API_FILE_STRUCTURE]: {
      type: String,
      match: VALID_URI,
    },

    // Source encoding of the data
    [API_FILE_ENCODING]: {
      type: String,
      enum: Object.values(getEncodings()),
      default: getEncodings().Unicode,
    },

    // Relevance status of the data
    //   - 'modified'   = the data is in the process of being created
    //                    but still incomplete
    //   - 'updated'    = the data is up to date
    //   - 'historical' = ancient data that has been updated
    //   - 'obsolete'   = dataset that is too old but cannot be updated
    //                    or replaced with another
    [API_FILE_UPDATE_STATUS]: {
      type: String,
      enum: Object.values(UpdateStatus),
    },
  },
  commonSchemaOptions
)

FileSchema.pre('save', function (next) {
  const mod = 'FileSchema'
  const fun = 'pre save hook'
  // logD('FileSchema', fun, ``)
  try {
    if (!isNotEmptyObject(this[API_FILE_CHECKSUM])) {
      throw new BadRequestError(missingField(API_FILE_CHECKSUM))
    }
    next()
  } catch (err) {
    logW(mod, fun, err)
    next(err)
  }
})

// -------------------------------------------------------------------------------------------------
// Series schema definition
// -------------------------------------------------------------------------------------------------
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

// -------------------------------------------------------------------------------------------------
// MediaService schema definition
// -------------------------------------------------------------------------------------------------
const ServiceSchema = new mongoose.Schema({}, commonSchemaOptions)

// -------------------------------------------------------------------------------------------------
// Schema refinements
// -------------------------------------------------------------------------------------------------

// ----- toJSON cleanup
MediaSchema.methods.toJSON = function () {
  return omit(this.toObject(), FIELDS_TO_SKIP)
}
FileSchema.methods.toJSON = function () {
  return omit(this.toObject(), FIELDS_TO_SKIP)
}
SeriesSchema.methods.toJSON = function () {
  return omit(this.toObject(), FIELDS_TO_SKIP)
}
ServiceSchema.methods.toJSON = function () {
  return omit(this.toObject(), FIELDS_TO_SKIP)
}

// -------------------------------------------------------------------------------------------------
// Hooks
// -------------------------------------------------------------------------------------------------
MediaSchema.pre('save', async function (next) {
  const fun = 'pre save hook'

  const media = this
  try {
    // logT(mod, fun, ``)
    if (!media[API_MEDIA_NAME]) media[API_MEDIA_NAME] = media[API_MEDIA_ID]
  } catch (err) {
    logV(mod, fun, `pre save checks KO: ${err}`)
    err.message = err.message + ` (media ${media[API_MEDIA_ID]})`
    next(err)
  }

  // next()
})

// -------------------------------------------------------------------------------------------------
// Models definition
// -------------------------------------------------------------------------------------------------
export const Media = mongoose.model('Media', MediaSchema)
export const MediaFile = Media.discriminator(MediaTypes.File, FileSchema, { clone: false })
export const MediaSeries = Media.discriminator(MediaTypes.Series, SeriesSchema, { clone: false })
export const MediaService = Media.discriminator(MediaTypes.Service, ServiceSchema, { clone: false })

Media.getSearchableFields = () => [
  API_MEDIA_ID,
  API_MEDIA_TYPE,
  API_MEDIA_NAME,
  API_FILE_MIME,
  API_FILE_UPDATE_STATUS,
]

Media.initialize = async () => {
  const fun = 'initMedia'
  try {
    await makeSearchable(Media)
  } catch (err) {
    RudiError.treatError(mod, fun, err)
  }
}
