//———————————————————————————————————————————————————————————————
// External dependancies
//———————————————————————————————————————————————————————————————
const mongoose = require('mongoose')

const Ids = require('../schemas/Identifiers')
const Validation = require('../schemaValidators')

//———————————————————————————————————————————————————————————————
// Custom schema definition
//———————————————————————————————————————————————————————————————
const ContactSchema = new mongoose.Schema({
  // Unique and permanent identifier for the contact in RUDI 
  // system (required)
  contact_id: Ids.UUIDv4,

  // Updated offical name of the contact's organization
  organization_name: {
    type: String
  },

  // Updated name of the service, or possibly the person
  contact_name: {
    type: String,
    required: true
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
module.exports = mongoose.model('Contact', ContactSchema)