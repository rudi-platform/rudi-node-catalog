'use strict';

//———————————————————————————————————————————————————————————————
// External dependancies

import Concept from './Concept';

//———————————————————————————————————————————————————————————————
const mongoose = require('mongoose')

const Validation = require('../schemaValidators')


//———————————————————————————————————————————————————————————————
// External schema definitions
//———————————————————————————————————————————————————————————————
const Ids = require('../schemas/Identifiers')


//———————————————————————————————————————————————————————————————
// Constants
//———————————————————————————————————————————————————————————————
export const ConceptSchemeId = Ids.UUIDv4;

//———————————————————————————————————————————————————————————————
// Custom schema definitions
//———————————————————————————————————————————————————————————————
const ConceptSchemeSchema = new mongoose.Schema({

  //---------------------------
  // ConceptScheme identifiers
  //---------------------------
  
  // Unique and permanent identifier for the concept scheme in RUDI system (required)
  concept_scheme_id: ConceptSchemeId,

  concept_scheme_title: String,

  top_concepts: [Concept]
})




//———————————————————————————————————————————————————————————————
// Exports
//———————————————————————————————————————————————————————————————
module.exports = mongoose.model('Metadata', ConceptSchemeSchema)