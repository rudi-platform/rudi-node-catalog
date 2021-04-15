'use strict';

//---------------------------------------------------------------
// External dependancies
//---------------------------------------------------------------
const mongoose = require('mongoose')
const Language = require('../thesaurus/Languages')

//---------------------------------------------------------------
// Custom schema definition
//---------------------------------------------------------------
const DictionaryEntry = new mongoose.Schema({
  lang: {
    type: String,
    default: Language.fr_FR,
    enum: Object.values(Language),
    required: true
  },
  text: {
    type: String,
    required: true
  }
}, {
  _id: false
})

//---------------------------------------------------------------
// Exports
//---------------------------------------------------------------
module.exports = DictionaryEntry