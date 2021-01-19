// External Dependancies
const mongoose = require('mongoose')

const dictionaryEntry = new mongoose.Schema({
  lang: String,
  text: String,
})

module.exports = mongoose.model('DictionaryEntry', dictionaryEntry)
