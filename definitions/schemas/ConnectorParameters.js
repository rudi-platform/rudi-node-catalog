// ------------------------------------------------------------------------------------------------
// External dependencies
// ------------------------------------------------------------------------------------------------
const mongoose = require('mongoose')

// ------------------------------------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------------------------------------
const ValueTypes = {
  String: 'STRING',
  Boolean: 'BOOLEAN',
  Date: 'DATE',
  Long: 'LONG',
  Double: 'DOUBLE',
  Enum: 'ENUM',
}

exports.ConnectorParameter = {
  key: String,
  value: String,
  type: {
    type: String,
    enum: Object.values(ValueTypes),
    _id: false,
  },
  usage: String,
  accepted_values: {
    type: [mongoose.Mixed],
    _id: false,
    default: undefined,
  },
}
