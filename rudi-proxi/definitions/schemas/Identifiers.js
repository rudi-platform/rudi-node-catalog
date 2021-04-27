'use strict';

//---------------------------------------------------------------
// External dependancies
//---------------------------------------------------------------
const mongoose = require('mongoose')
// const uuid = require('uuid');

const Validation = require('../schemaValidators')

//---------------------------------------------------------------
// Constants
//---------------------------------------------------------------

exports.UUIDv4 = {
  type: String,
  // default: _ => uuid.v4(),
  trim: true,
  required: true,
  unique: true,
  index: true,
  lowercase: true,
  match: Validation.UUID
}

exports.UUID = {
  type: String,
  // default: _ => uuid.v4(),
  trim: true,
  lowercase: true,
  match: Validation.UUID
}

exports.DOI = {
  type: String,
  trim: true,
  unique: true,
  sparse: true, // accept empty values as non-duplicates 
  lowercase: true,
  match: Validation.DOI
}