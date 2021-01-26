// External Dependancies
const mongoose = require('mongoose')

const Dico = require('./dictionary-entry').DictionaryEntry
const Validation = require('./schema-validators')


const metadataSchema = new mongoose.Schema({
  // IDENTIFICATION
  global_id: {
    type: String,
    required: true,
    lowercase: true,
    validate: Validation.isRudiID
  },
  local_id: {
    type: String,
  },
  doi: {
    type: String,
    lowercase: true,
    validate: Validation.isDOI
  },

  // DESCRIPTION
  resource_title: String,
  summary: [DictionaryEntry],
  purpose: String,
  resource_language: String,

  /*
  services: {
    type: Map,
    of: String
  }
  */
})

module.exports = mongoose.model('MetadataSchema', metadataSchema)


