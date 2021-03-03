//———————————————————————————————————————————————————————————————
// External dependancies
//———————————————————————————————————————————————————————————————
const mongoose = require('mongoose')

const Ids = require('../schemas/Identifiers')
const Validation = require('../schemaValidators')

const FileSchema = require('./MediaFile')
const SeriesSchema = require('./MediaSeries')

//———————————————————————————————————————————————————————————————
// Custom schema definition
//———————————————————————————————————————————————————————————————
const MediaSchema = new mongoose.Schema({
  // Unique and permanent identifier for the organization in RUDI 
  // system (required)
  media_id: {
    type: Ids.UUIDv4
  },

  // Updated offical name of the organization
  media_type: {
    type: String,
    enum: Object.values(['FILE', 'SERIES']),
    required: true
  },

  // Updated name of the service, or possibly the person
  connector: {
    url: {
      type: String,
      required: true
    },
    // TODO: define this properly. 
    // Most likely an enum defined in Rudi that can be handled in 
    // a known manner
    interface_contract: String
  },
}, { discriminatorKey: 'media_type' })

const Media = mongoose.model('Media', MediaSchema)

const MediaFile = Media.discriminator('FILE', FileSchema)
const MediaSeries = Media.discriminator('SERIES', SeriesSchema)

//———————————————————————————————————————————————————————————————
// Exports
//———————————————————————————————————————————————————————————————
module.exports = {Media, MediaFile, MediaSeries}