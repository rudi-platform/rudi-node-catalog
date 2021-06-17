'use strict'

const mod = 'storStatThes'

// -----------------------------------------------------------------------------
// Internal dependencies
// -----------------------------------------------------------------------------
const log = require('../../utils/logging')
const { parameterExpected } = require('../../utils/msg')

// -----------------------------------------------------------------------------
// Custom schema definition
// -----------------------------------------------------------------------------
const StorageStatus = ['online', 'archived', 'unavailable']

// -----------------------------------------------------------------------------
// Getter / setter
// -----------------------------------------------------------------------------
let Thesaurus = StorageStatus

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
