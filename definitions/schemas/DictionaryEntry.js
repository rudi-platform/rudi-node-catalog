//———————————————————————————————————————————————————————————————
// External dependancies
//———————————————————————————————————————————————————————————————
const mongoose = require('mongoose')
const Language = require('../thesaurus/Languages')

//———————————————————————————————————————————————————————————————
// Custom schema definition
//———————————————————————————————————————————————————————————————
const DictionaryEntrySchema = new mongoose.Schema({
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
})

//———————————————————————————————————————————————————————————————
// Exports
//———————————————————————————————————————————————————————————————
module.exports = DictionaryEntrySchema
