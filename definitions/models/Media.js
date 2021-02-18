//———————————————————————————————————————————————————————————————
// External dependancies
//———————————————————————————————————————————————————————————————
const mongoose = require('mongoose')

const Ids = require('../schemas/Identifiers')
const Validation = require('../schemaValidators')

//———————————————————————————————————————————————————————————————
// Custom schema definition
//———————————————————————————————————————————————————————————————
const MediaSchema = new mongoose.Schema({
  // Unique and permanent identifier for the organization in RUDI 
  // system (required)
  media_id: {
    type: Ids.UUIDv4
  },

  // Updated offical name of the organization
  media_type: {
    type: String,
    enum: Object.values(['FILE', 'SERIES']),
    required: true
  },

  // Updated name of the service, or possibly the person
  connector: {
    url: {
      type: String,
      required: true
    },
    interface_contract: String
  },

  // Updated status of the contact person
  role: {
    type: String
  },

  // Updated offical postal address of the organization
  email: {
    type: String,
    required: true,
    validate: {
      validator: Validation.isEmail,
      message: '{VALUE} is not a valid e-mail'
    }
  }
})

//———————————————————————————————————————————————————————————————
// Exports
//———————————————————————————————————————————————————————————————
module.exports = mongoose.model('Media', MediaSchema)