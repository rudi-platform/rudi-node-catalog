'use strict'

// -----------------------------------------------------------------------------
// Custom schema definition
// -----------------------------------------------------------------------------

// Method for computing the integrity hash of the data
const Keywords = [
  'agriculture',
  'bike',
  'biogaz',
  'building',
  'bus',
  'car',
  'city',
  'electricity',
  'energy_consommation',
  'gaz',
  'grid',
  'industry',
  'iris',
  'metro',
  'municipality',
  'plu',
  'population',
  'production',
  'research',
  'school',
  'sensor',
  'stop',
  'telecom',
  'transport',
  'waste',
  'wind',
]

// -----------------------------------------------------------------------------
// Getter / setter
// -----------------------------------------------------------------------------
let Thesaurus = Keywords

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
