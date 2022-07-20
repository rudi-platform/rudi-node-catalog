// -------------------------------------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------------------------------------
import {
  API_DATES_CREATED,
  API_DATES_DELETED,
  API_DATES_EDITED,
  API_DATES_EXPIRES,
  API_DATES_PUBLISHED,
  API_DATES_VALIDATED,
} from '../../db/dbFields.js'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { nowISO } from '../../utils/jsUtils.js'

// -------------------------------------------------------------------------------------------------
// Custom schema definition
// -------------------------------------------------------------------------------------------------
export const ReferenceDatesSchema = {
  [API_DATES_CREATED]: {
    type: Date,
    default: nowISO(),
  },
  [API_DATES_EDITED]: Date,
  [API_DATES_VALIDATED]: Date,
  [API_DATES_PUBLISHED]: Date,
  [API_DATES_EXPIRES]: Date,
  [API_DATES_DELETED]: Date,
}

// -------------------------------------------------------------------------------------------------
// Exports
// -------------------------------------------------------------------------------------------------
export default ReferenceDatesSchema
