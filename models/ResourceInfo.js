// External Dependancies
const mongoose = require('mongoose')
const DictionaryEntry = require('./DictionaryEntry')

const valid = require('./SchemaValidators')


const resourceInfoSchema = new mongoose.Schema({
  // IDENTIFICATION
  global_id: {
    type: String,
    required: true,   
    lowercase: true,     
    validate: { 
      validator: valid.isRudiID,
      message: props => `${props} is not a valid RUDI ID`
    },
  },
  local_id: {
    type: String,
    validate: { 
      validator: valid.isUUIDv4,
      message: props => `${props} is not a valid UUIDv4`
    },
  },
 
  // DESCRIPTION
 /*  resource_title: String,
  summary: [DictionaryEntry],
  purpose: String,
  resource_language: String, */
  
  /*
  services: {
    type: Map,
    of: String
  }
  */
})

module.exports = mongoose.model('ResourceInfo', resourceInfoSchema)


