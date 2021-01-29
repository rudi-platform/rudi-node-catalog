//———————————————————————————————————————————————————————————————
// External dependancies
//———————————————————————————————————————————————————————————————
const mongoose = require('mongoose')

const Validation = require('../schemaValidators')

//———————————————————————————————————————————————————————————————
// Constants
//———————————————————————————————————————————————————————————————

exports.UUIDv4 = {
  type: String,
  trim: true,
  required: true,
  unique: true,
  dropDups: true,
  // index: true,
  lowercase: true,
  validate: {
    validator: Validation.isUUIDv4,
    message: '{VALUE} does not appear to be a valid UUID v4'
  }
}

exports.RudiID = {
  type: String,
  trim: true,
  required: true,
  unique: true,
  dropDups: true,
  // index: true,
  lowercase: true,
  validate: {
    validator: Validation.isRudiID,
    message: '{VALUE} does not appear to be a valid RUDI ID (UUID v4)'
  }
}

exports.DOI = {
  type: String,
  trim: true,
  unique: true,
  lowercase: true,
  validate: {
    validator: Validation.isDOI,
    message: '{VALUE} does not appear to be a valid DOI'
  }
}