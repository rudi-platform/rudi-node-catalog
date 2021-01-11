// External Dependancies
const mongoose = require('mongoose')

const dictionaryEntrySchema = new mongoose.Schema({
  lang: String,
  text: String,
})

module.exports = mongoose.model('DictionaryEntry', dictionaryEntrySchema)
