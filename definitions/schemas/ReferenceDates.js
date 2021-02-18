//———————————————————————————————————————————————————————————————
// External dependancies
//———————————————————————————————————————————————————————————————
const mongoose = require('mongoose')

//———————————————————————————————————————————————————————————————
// Custom schema definition
//———————————————————————————————————————————————————————————————
const ReferenceDatesSchema = new mongoose.Schema({
  created: {
    type: Date,
    required: true
  },
  validated: {
    type: Date
  },
  published: {
    type: Date,
    required: true
  },
  updated: {
    type: Date
  },
  deleted: {
    type: Date
  }
})


//———————————————————————————————————————————————————————————————
// Exports
//———————————————————————————————————————————————————————————————
module.exports = ReferenceDatesSchema