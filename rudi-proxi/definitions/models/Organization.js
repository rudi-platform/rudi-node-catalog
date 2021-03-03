//———————————————————————————————————————————————————————————————
// External dependancies
//———————————————————————————————————————————————————————————————
const mongoose = require('mongoose')

const Ids = require('../schemas/Identifiers')
const Validation = require('../schemaValidators')

//———————————————————————————————————————————————————————————————
// Custom schema definition
//———————————————————————————————————————————————————————————————
const OrganizationSchema = new mongoose.Schema({
  // Unique and permanent identifier for the organization in RUDI 
  // system (required)
  organization_id: {
    type: Ids.UUIDv4,
  },

  // Updated offical name of the organization
  organization_name: {
    type: String,
    required: true
  },

  // Updated offical postal address of the organization
  organization_address: {
    type: String,
    required: true
  }
})

//———————————————————————————————————————————————————————————————
// Exports
//———————————————————————————————————————————————————————————————
module.exports = mongoose.model('Organization', OrganizationSchema)