'use strict'

// -----------------------------------------------------------------------------
// Custom schema definition
// -----------------------------------------------------------------------------

const FileTypes = [
  'application/x-executable',
  'application/graphql',
  'application/javascript',
  'application/json',
  'application/ld+json',
  'application/msword', // (.doc)
  'application/pdf',
  'application/sql',
  'application/vnd.api+json',
  'application/vnd.ms-excel', // (.xls)
  'application/vnd.ms-powerpoint', // (.ppt)
  'application/vnd.oasis.opendocument.text', // (.odt)
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // (.pptx)
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // (.xlsx)
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // (.docx)',
  'application/x-www-form-urlencoded',
  'application/xml',
  'application/zip',
  'application/zstd', // (.zst)
  'audio/mpeg',
  'audio/ogg',
  'image/gif',
  'image/apng',
  'image/flif',
  'image/webp',
  'image/x-mng',
  'image/jpeg',
  'image/png',
  'multipart/form-data',
  'text/css',
  'text/csv',
  'text/html',
  'text/php',
  'text/plain',
  'text/xml',
]

// -----------------------------------------------------------------------------
// Getter / setter
// -----------------------------------------------------------------------------
let Thesaurus = FileTypes

exports.initialize = (arg) => {
  if (arg) Thesaurus = []
}

exports.get = () => {
  return Thesaurus
}

exports.set = (newVal) => {
  newVal = newVal.trim()
  if (Thesaurus.indexOf(newVal) === -1) Thesaurus.push(newVal)
}

exports.isValid = (val, shouldInit) => {
  val = val.trim()
  const isIn = Thesaurus.indexOf(val) > -1
  if (!isIn && shouldInit) {
    this.set(val)
    return true
  }
  return isIn
}
