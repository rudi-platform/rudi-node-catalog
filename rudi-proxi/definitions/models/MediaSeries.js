'use strict';

//———————————————————————————————————————————————————————————————
// External dependancies
//———————————————————————————————————————————————————————————————
const mongoose = require('mongoose')
const Int32 = require('mongoose-int32')

const Ids = require('../schemas/Identifiers')
const Validation = require('../schemaValidators')


//———————————————————————————————————————————————————————————————
// Constants
//———————————————————————————————————————————————————————————————

// const FileTypes = require('../thesaurus/FileTypes')

//———————————————————————————————————————————————————————————————
// Custom schema definition
//———————————————————————————————————————————————————————————————
const SeriesSchema = new mongoose.Schema({

  // Theorical delay between the production of the record and its availability,
  // in milliseconds.
  latency: {
    type: Int32,
    minimum: 0
  },

  // Theorical delay between the production of two records, in milliseconds.
  period: {
    type: Int32,
    minimum: 0
  },

  // Actual number of records
  current_number_of_records: {
    type: Int32,
    minimum: 0
  },

  // Actual size of the data, in bytes (refreshed automatically)
  current_size: {
    type: Int32,
    minimum: 0
  },

  // Estimated total number of records
  total_number_of_records: {
    type: Int32,
    minimum: 0
  },

  // Estimated total size of the data, in bytes 
  total_size: {
    type: Int32,
    minimum: 0
  },

})



//———————————————————————————————————————————————————————————————
// Exports
//———————————————————————————————————————————————————————————————
module.exports = SeriesSchema