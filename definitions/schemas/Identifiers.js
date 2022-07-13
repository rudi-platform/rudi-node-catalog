// ------------------------------------------------------------------------------------------------
// External dependencies
// ------------------------------------------------------------------------------------------------
// import uuid from 'uuid'

import { VALID_DOI, VALID_UUID } from '../schemaValidators.js'

// ------------------------------------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------------------------------------

export const UUIDv4 = {
  type: String,
  // default: _ => uuid.v4(),
  trim: true,
  required: true,
  unique: true,
  index: true,
  lowercase: true,
  match: VALID_UUID,
}

export const UUID = {
  type: String,
  // default: _ => uuid.v4(),
  trim: true,
  lowercase: true,
  match: VALID_UUID,
}

export const DOI = {
  type: String,
  trim: true,
  unique: true,
  sparse: true, // accept empty values as non-duplicates
  lowercase: true,
  match: VALID_DOI,
  default: undefined,
}
