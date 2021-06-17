'use strict'

const mod = 'langThes'

// -----------------------------------------------------------------------------
// Internal dependencies
// -----------------------------------------------------------------------------
const log = require('../../utils/logging')
const { parameterExpected } = require('../../utils/msg')

// -----------------------------------------------------------------------------
// Custom schema definition
// -----------------------------------------------------------------------------

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
  'sk',
]

// -----------------------------------------------------------------------------
// Getter / setter
// -----------------------------------------------------------------------------
let Thesaurus = Languages

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
