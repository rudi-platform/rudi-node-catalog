// ------------------------------------------------------------------------------------------------
// External dependencies
// ------------------------------------------------------------------------------------------------
import mongoose from 'mongoose'

import _ from 'lodash'
const { omit } = _

import mongooseInt32 from 'mongoose-int32'
const Int32 = mongooseInt32.loadType(mongoose)

// ------------------------------------------------------------------------------------------------
// Internal dependencies
// ------------------------------------------------------------------------------------------------
import { UUID } from '../schemas/Identifiers.mjs'

// ------------------------------------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------------------------------------
import { FIELDS_TO_SKIP } from '../../db/dbFields.mjs'
// ------------------------------------------------------------------------------------------------
// Custom schema definition
// ------------------------------------------------------------------------------------------------
const PortalTokenSchema = new mongoose.Schema(
  {
    /** Base 64 encoded token information */
    access_token: {
      type: String,
    },

    token_type: {
      type: String,
    },

    /** Token life span in seconds */
    expires_in: {
      type: Int32,
    },

    /** Expiration date in Epoch seconds */
    exp: {
      type: Int32,
    },

    scope: {
      type: String,
    },

    jti: {
      type: UUID,
    },
  },
  {
    timestamps: true,
  }
)

PortalTokenSchema.methods.toJSON = function () {
  return omit(this.toObject(), FIELDS_TO_SKIP)
}

// ------------------------------------------------------------------------------------------------
// Exports
// ------------------------------------------------------------------------------------------------
const PortalToken = mongoose.model('PortalToken', PortalTokenSchema)
export default PortalToken
