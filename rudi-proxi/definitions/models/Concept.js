'use strict';

//———————————————————————————————————————————————————————————————
// External dependancies
//———————————————————————————————————————————————————————————————
const mongoose = require('mongoose');

const Validation = require('../schemaValidators');


//———————————————————————————————————————————————————————————————
// External schema definitions
//———————————————————————————————————————————————————————————————
const ids = require('../schemas/Identifiers');
const Contact = require('./Contact');
const ConceptScheme = require('./ConceptScheme');
const DictionaryEntry = require('../Schemas/DictionaryEntry');


//———————————————————————————————————————————————————————————————
// Constants
//———————————————————————————————————————————————————————————————
const ConceptId = ids.UUIDv4;


//———————————————————————————————————————————————————————————————
// Custom schema definitions
//———————————————————————————————————————————————————————————————
const ConceptSchema = new mongoose.Schema({

  //---------------------------
  // ConceptScheme identifiers
  //---------------------------

  // Unique and permanent identifier for the concept in RUDI system (required)
  // == skos:notation
  concept_id: ConceptId,

  // Simple name for the concept
  // == <#CONCEPT_LABEL> a skos:Concept; 
  concept_name: String,

  // Internationalized labels
  concept_pref_label: [DictionaryEntry],

  // Documentation: internationalized definition
  concept_definition: [DictionaryEntry],

  // Documentation: internationalized example
  concept_example: [DictionaryEntry],

  // Documentation: internationalized validation msg
  concept_editorial_note: {
    validation_date: Date,
    validated_by: Contact
  }

  // Concepts relationship
  concept_parent: ConceptId,
  concept_children: [ConceptId],

  concept_in_scheme: ConceptScheme.ConceptSchemeId,
})




//———————————————————————————————————————————————————————————————
// Exports
//———————————————————————————————————————————————————————————————
module.exports = mongoose.model('Metadata', ConceptSchema)