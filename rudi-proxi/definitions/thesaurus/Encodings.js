'use strict'

// -----------------------------------------------------------------------------
// Custom schema definition
// -----------------------------------------------------------------------------
const Encodings = [
  'Unicode',
  'ISO/IEC 10646',
  'UTF-8',
  'UTF-16',
  'ISO/CEI 8859-1',
  'MacRoman',
  'Windows-1252',
  'US-ASCII',
  'ASCII',
]

// -----------------------------------------------------------------------------
// Getter / setter
// -----------------------------------------------------------------------------
let Thesaurus = Encodings

exports.init = (arg) => {
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
