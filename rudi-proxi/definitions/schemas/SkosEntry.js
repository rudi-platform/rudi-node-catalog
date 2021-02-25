//———————————————————————————————————————————————————————————————
// External dependancies
//———————————————————————————————————————————————————————————————
const mongoose = require('mongoose')

const Validation = require('../schemaValidators')

const DictionaryEntry = require('./DictionaryEntry')

//———————————————————————————————————————————————————————————————
// Custom schema definition
//———————————————————————————————————————————————————————————————
const SkosEntrySchema = new mongoose.Schema({
  // Term used in RUDI system (eg in metadata files), most likely english one
  skos_value: String,
  
  // URI of the thesaurus that hosts the traduction of this term
  skos_uri: {
    type: String,
    validate: Validation.isURI
  },
  
  // Meaning, explaination of the context of use of this entry
  skos_context: [DictionaryEntry]
})

//———————————————————————————————————————————————————————————————
// Exports
//———————————————————————————————————————————————————————————————
module.exports = SkosEntrySchema

/* 
#---------------------------------------------------------------------------
'SkosEntry':
  type: object
  required:
  - skos_value
  - skos_uri
  properties:
    'skos_value':
      description: 
        Term used in RUDI system (eg in metadata files), most likely english one
      type: string
    'skos_uri':
      description: 
        URI of the thesaurus that hosts the traduction of this term
      type: string
      format: URI
    'skos_context':
      description:  
        Meaning, explaination of the context of use of this entry
      type: string
  example:
    {
      value: 'transport',
      skos_uri: 'https://publications.europa.eu/resource/authority/eurovoc/100237'
    }
 */