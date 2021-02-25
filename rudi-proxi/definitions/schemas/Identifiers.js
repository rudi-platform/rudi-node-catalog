//———————————————————————————————————————————————————————————————
// External dependancies
//———————————————————————————————————————————————————————————————
const mongoose = require('mongoose')
const {
  v4: uuidv4
} = require('uuid');

const Validation = require('../schemaValidators')

//———————————————————————————————————————————————————————————————
// Constants
//———————————————————————————————————————————————————————————————

const UUIDv4 = {
  type: String,
  default: _ => uuidv4(),
  trim: true,
  required: true,
  unique: true,
  dropDups: true,
  index: true,
  lowercase: true,
  validate: {
    validator: Validation.isUUIDv4,
    message: '{VALUE} does not appear to be a valid UUID v4'
  }
}

RudiID = {
  type: String,
  default: _ => uuidv4(),
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

const DOI = {
  type: String,
  trim: true,
  unique: true,
  lowercase: true,
  validate: {
    validator: Validation.isDOI,
    message: '{VALUE} does not appear to be a valid DOI'
  }
}

module.exports = {
  UUIDv4,
  DOI
}