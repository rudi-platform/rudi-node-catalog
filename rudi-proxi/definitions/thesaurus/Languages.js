'use strict'

// ---------------------------------------------------------------
// External dependancies
// ---------------------------------------------------------------

// ---------------------------------------------------------------
// Custom schema definition
// ---------------------------------------------------------------

// documentation: https://www.rfc-editor.org/rfc/bcp/bcp47.txt
const Languages = [
  'cs-CZ',
  'da-DK',
  'de-CH',
  'de-DE',
  'en-GB',
  'en-US',
  'el-GR',
  'es-ES',
  'fr-BE',
  'fr-FR',
  'hu-HU',
  'it-IT',
  'no-NO',
  'pl-PL',
  'pt-PT',
  'ro-RO',
  'ru-RU',
  'sk-SK',
  'cs',
  'da',
  'de',
  'en',
  'el',
  'es',
  'fr',
  'hu',
  'it',
  'no',
  'pl',
  'pt',
  'ro',
  'ru',
  'sk'
]

// ---------------------------------------------------------------
// Getter / setter
// ---------------------------------------------------------------
let Thesaurus = Languages

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
