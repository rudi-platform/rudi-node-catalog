'use strict'

// const mod = 'SkosScheme'

// -----------------------------------------------------------------------------
// External dependancies
// -----------------------------------------------------------------------------
const mongoose = require('mongoose')

// -----------------------------------------------------------------------------
// Internal dependencies
// -----------------------------------------------------------------------------
const utils = require('../../utils/jsUtils')
const Validation = require('../schemaValidators')

// -----------------------------------------------------------------------------
// Other custom schema definitions
// -----------------------------------------------------------------------------
const ids = require('../schemas/Identifiers')
const DictionaryEntry = require('../schemas/DictionaryEntry')

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------
const validArrayNotNull = {
  validator: utils.isNotEmptyArray,
  message: `'{PATH}' property should not be empty`,
}

// -----------------------------------------------------------------------------
// Custom schema definition: SkosScheme
// -----------------------------------------------------------------------------
/**
 * Set of SKOS concepts gathered in a transversal and hierarchical
 * relationships.
 */
const SkosSchemeSchema = new mongoose.Schema(
  {
    // ---------------------------
    // ConceptScheme identifiers
    // ---------------------------

    /**
     * Unique and permanent identifier for the concept scheme in RUDI system (required)
     */
    scheme_id: ids.UUIDv4,

    /**
     * Short abstract code / simple name for the concept scheme
     * == <#CONCEPT_LABEL> a skos:Concept
     */
    scheme_code: {
      type: String,
      minlength: 2,
      maxlength: 30,
      unique: true,
      index: true,
      lowercase: true,
      required: true,
    },

    /** Short code for the concept scheme */
    scheme_label: {
      type: [DictionaryEntry],
      required: true,
      validate: validArrayNotNull,
    },

    /** Web page that document the SKOS concept scheme */
    scheme_uri: {
      type: String,
      match: Validation.URI,
    },

    /** List of the highest level concepts in the concept scheme */
    top_concepts: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'SkosConcept',
        },
      ],
    },
  },
  {
    timestamps: true,
    id: false,
    optimisticConcurrency: true,
    useNestedStrict: true,
    toObject: {
      getters: true,
      setters: true,
      virtuals: true,
    },
    toJSON: {
      getters: true,
      setters: true,
      virtuals: true,
    },
  }
)

// -----------------------------------------------------------------------------
// Schema refinements
// -----------------------------------------------------------------------------

// ----- toJSON cleanup
SkosSchemeSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.id
  delete obj._id
  delete obj.__v
  delete obj.createdAt
  delete obj.updatedAt
  return obj
}

// -----------------------------------------------------------------------------
// Exports
// -----------------------------------------------------------------------------
module.exports = mongoose.model('SkosScheme', SkosSchemeSchema)
