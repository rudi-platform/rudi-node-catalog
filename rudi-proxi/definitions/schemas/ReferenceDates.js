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
}, { _id: false })


//———————————————————————————————————————————————————————————————
// Exports
//———————————————————————————————————————————————————————————————
module.exports = ReferenceDatesSchema