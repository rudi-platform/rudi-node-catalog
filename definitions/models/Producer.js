//———————————————————————————————————————————————————————————————
// External dependancies
//———————————————————————————————————————————————————————————————
const mongoose = require('mongoose')

//———————————————————————————————————————————————————————————————
// Custom schema definition
//———————————————————————————————————————————————————————————————
const ProducerSchema = new mongoose.Schema({
  // Updated offical name of the organization
  organization_name: { 
    type: String,
    required: true
  },

  // Updated offical postal address of the organization
  address: {
    type: String,
    required: true
  }
})

//———————————————————————————————————————————————————————————————
// Exports
//———————————————————————————————————————————————————————————————
module.exports = mongoose.model('Producer', ProducerSchema)
