'use strict'

const mod = 'themeThes'

// -----------------------------------------------------------------------------
// Internal dependencies
// -----------------------------------------------------------------------------
const log = require('../../utils/logging')
const { parameterExpected } = require('../../utils/msg')

// -----------------------------------------------------------------------------
// Custom schema definition
// -----------------------------------------------------------------------------

// Method for computing the integrity hash of the data
const Themes = [
  'farming',
  'biota',
  'boundaries',
  'climatologyMeteorologyAtmosphere',
  'economy',
  'elevation',
  'environment',
  'geoscientificInformation',
  'health',
  'imageryBaseMapsEarthCover',
  'intelligenceMilitary',
  'inlandWaters',
  'location',
  'oceans',
  'planningCadastre',
  'society',
  'structure',
  'transportation',
  'utilitiesCommunication',
]
/*   farming: "Agriculture",
  biota: "Biote",
  biota: "Biote",
  boundaries: "Limites",
  climatologyMeteorologyAtmosphere: "Climatologie/Météorologie/Atmosphère",
  economy: "Économie",
  elevation: "Altitude",
  environment: "Environnement",
  geoscientificInformation: "Informations géoscientifiques",
  health: "Santé",
  imageryBaseMapsEarthCover: "Imagerie/Cartes de base/Occupation des terres",
  intelligenceMilitary: "Renseignement/Secteur militaire",
  inlandWaters: "Eaux intérieures",
  location: "Localisation",
  oceans: "Océans",
  planningCadastre: "Planification/Cadastre",
  society: "Société",
  structure: "Structure",
  transportation: "Transport",
  utilitiesCommunication: "Services d’utilité publique/Communication",
}
  */

// -----------------------------------------------------------------------------
// Getter / setter
// -----------------------------------------------------------------------------
let Thesaurus = Themes

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
