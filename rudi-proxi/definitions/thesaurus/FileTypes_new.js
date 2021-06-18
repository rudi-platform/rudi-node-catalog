'use strict'

const mod = 'ftypThes'

// -----------------------------------------------------------------------------
// Internal dependencies
// -----------------------------------------------------------------------------
const log = require('../../utils/logging')
const { parameterExpected } = require('../../utils/msg')

// -----------------------------------------------------------------------------
// Custom schema definition
// -----------------------------------------------------------------------------

// MIME types : https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types

const FileTypes = [
  'application/epub+zip', // (.epub)
  'application/geo+json', // (.geojson)
  'application/graphql',
  'application/gzip', // (.gz, .gzip, .tar.gz, .tgz)
  'application/javascript',
  'application/json', // (.json)
  'application/ld+json',
  'application/msword', // (.doc)
  'application/octet-stream', // (.bin)
  'application/pdf', // (.pdf)
  'application/sql', // (.sql)
  'application/vnd.api+json',
  'application/vnd.ms-excel', // (.xls)
  'application/vnd.ms-powerpoint', // (.ppt)
  'application/vnd.oasis.opendocument.presentation', // (.odp)
  'application/vnd.oasis.opendocument.spreadsheet', // (.ods)
  'application/vnd.oasis.opendocument.text', // (.odt)
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // (.pptx)
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // (.xlsx)
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // (.docx)',
  'application/x-7z-compressed', // (.7z)
  'application/x-bzip', // (.bz, .tar.bz)
  'application/x-bzip2', // (.bz2, .tar.bz2)
  'application/x-executable', // (.exe)
  'application/x-tar', //(.tar)
  'application/x-www-form-urlencoded',
  'application/xml', // (.xml)
  'application/zip', // (.zip)
  'application/zstd', // (.zst)
  'audio/aac', // (.aac)
  'audio/m4a', // (.m4a)
  'audio/mpeg', // (.mp3)
  'audio/ogg', // (.oga, .ogg)
  'audio/wav', // (.wav)
  'audio/webm', // (.weba)
  'font/otf', // (.otf)
  'font/ttf', // (.ttf)
  'image/apng', // (.apng)
  'image/bmp', // (.bmp)
  'image/flif', // (.flif)
  'image/gif', // (.gif)
  'image/jpeg', // (.jpg, .jpeg)
  'image/png', // (.png)
  'image/tiff', // (.tif, .tiff)
  'image/vnd.microsoft.icon', // (.ico)
  'image/webp', // (.webp)
  'image/x-mng', // (.mng)
  'multipart/form-data',
  'text/css', // (.css)
  'text/csv', // (.csv)
  'text/html', // (.htm, .html)
  'text/php', // (.php)
  'text/plain', // (.txt)
  'text/xml', // (.xml)
  'video/3gpp', // (.3gp, .3gpp)
  'video/mp4', // (.mp4)
  'video/mpeg', // (.mpg, .mpeg)
  'video/ogg', // (.ogv)
  'video/quicktime', // (.mov)
  'video/webm', // (.webm)
  'video/x-matroska', // (.mkv)
  'video/x-ms-wmv', // (.wmv)
  'video/x-msvideo', // (.avi)
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

exports.set = (newValue) => {
  const fun = 'set'
  if (!newValue) parameterExpected(fun, 'newValue')
  newVal = `${newVal}`.trim()
  if (Thesaurus.indexOf(newValue) === -1) Thesaurus.push(newValue)
}

exports.isValid = (value, shouldInit) => {
  const fun = 'isValid'
  if (!value) parameterExpected(fun, 'value')
  const isIn = Thesaurus.indexOf(value) > -1
  if (!isIn && shouldInit) {
    this.set(value)
    return true
  }
  return isIn
}
