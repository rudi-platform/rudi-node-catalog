'use strict';

//———————————————————————————————————————————————————————————————
// External dependancies
//———————————————————————————————————————————————————————————————
const mongoose = require('mongoose')
// const uuid = require('uuid');

const Validation = require('../schemaValidators')

//———————————————————————————————————————————————————————————————
// Constants
//———————————————————————————————————————————————————————————————

exports.UUIDv4 = {
  type: String,
  // default: _ => uuid.v4(),
  trim: true,
  required: true,
  unique: true,
  index: true,
  lowercase: true,
  validate: {
    validator: Validation.isUUIDv4,
    message: '{VALUE} does not appear to be a valid UUID v4'
  }
}

exports.UUID = {
  type: String,
  // default: _ => uuid.v4(),
  trim: true,
  lowercase: true,
  validate: {
    validator: Validation.isUUIDv4,
    message: '{VALUE} does not appear to be a valid UUID v4'
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
