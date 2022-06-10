'use strict'

const mod = 'keywThes'

// ------------------------------------------------------------------------------------------------
// Internal dependencies
// ------------------------------------------------------------------------------------------------
const log = require('../../utils/logging')
const Thesaurus = require('./Thesaurus')

// ------------------------------------------------------------------------------------------------
// Dynamic enum init
// ------------------------------------------------------------------------------------------------

const CODE = 'keywords'
const INIT_VALUES = [
  'agriculture',
  'bike',
  'car',
  'biogaz',
  'building',
  'bus',
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

const Keywords = new Thesaurus(CODE, INIT_VALUES)

module.exports = Keywords
