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

const MediaTypes = {
  'application/x-executable'
  'application/graphql'
  'application/javascript'
  'application/json'
  'application/ld+json'
  'application/msword' // (.doc)
  'application/pdf'
  'application/sql'
  'application/vnd.api+json'
  'application/vnd.ms-excel' // (.xls)
  'application/vnd.ms-powerpoint' // (.ppt)
  'application/vnd.oasis.opendocument.text' // (.odt)
  'application/vnd.openxmlformats-officedocument.presentationml.presentation' // (.pptx)
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // (.xlsx)
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // (.docx)'
  'application/x-www-form-urlencoded'
  'application/xml'
  'application/zip'
  'application/zstd' // (.zst)
  'audio/mpeg'
  'audio/ogg'
  'image/gif'
  'image/apng'
  'image/flif'
  'image/webp'
  'image/x-mng'
  'image/jpeg'
  'image/png'
  'multipart/form-data'
  'text/css'
  'text/csv'
  'text/html'
  'text/php'
  'text/plain'
  'text/xml'  
}

//———————————————————————————————————————————————————————————————
// Custom schema definition
//———————————————————————————————————————————————————————————————
const FileSchema = new mongoose.Schema({

  // Link towards the resource that describes the structure of the data
  // (language, norm, data structure, JSON schema, OpenAPI, etc.)
  file_structure: {
    type: String,
    validate: {
      validator: Validation.isURI,
      message: '{VALUE} is not a valid URI'
    }
  },

  // Size of the file, in bytes 
  file_size: {
    type: Int32,
    required: true
  },

  // Source encoding of the data
  file_encoding: {
    type: String,
    default: Encoding.Unicode,
    enum: Object.values(Encoding)
  },

  // Makes it possible to check data integrity
  checksum: {
    algo: {
      type: [Object.values(HashAlgorithms)],
      require: true
    },
    hash: {
      type: String,
      require: true
    }
  },
  // Relevance status of the data
  //   - 'modified'   = the data is in the process of being created
  //                    but still incomplete
  //   - 'updated'    = the data is up to date
  //   - 'historical' = ancient data that has been updated
  //   - 'obsolete'   = dataset that is too old but cannot be updated 
  //                    or replaced with another
  update_status: {
    type: [Object.values(UpdateStatus)]
  },

  // Native format of the resource
  file_type: {
    type: String,
    enum: Object.values(MediaTypes)
  },

})



//———————————————————————————————————————————————————————————————
// Exports
//———————————————————————————————————————————————————————————————
module.exports = mongoose.model('File', FileSchema)