'use strict'

// ---------------------------------------------------------------
// Custom schema definition
// ---------------------------------------------------------------

// Method for computing the integrity hash of the data
const HashAlgorithms = [
  'MD5',
  'SHA-256',
  'SHA-512'
]

// ---------------------------------------------------------------
// Getter / setter
// ---------------------------------------------------------------
let Thesaurus = HashAlgorithms

exports.init = (arg) => {
  if (arg) Thesaurus = []
}

exports.get = () => {
  return Thesaurus
}

exports.set = (newVal) => {
  if (Thesaurus.indexOf(newVal) === -1) Thesaurus.push(newVal)
}

exports.isValid = (val, shouldInit) => {
  const isIn = Thesaurus.indexOf(val) > -1
  if (!isIn && shouldInit) {
    this.set(val)
    return true
  }
  return isIn
}
