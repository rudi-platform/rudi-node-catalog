'use strict'

const mod = 'themeThes'

// -----------------------------------------------------------------------------
// Internal dependencies
// -----------------------------------------------------------------------------
const log = require('../../utils/logging')
const { parameterExpected } = require('../../utils/msg')
const Thesaurus = require('./Thesaurus')

// -----------------------------------------------------------------------------
// Dynamic enum init
// -----------------------------------------------------------------------------

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

const CODE = 'themes'
const INIT_VALUES = [
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

const themes = new Thesaurus(CODE, INIT_VALUES)

const fun = `init ${CODE}`
// log.d(mod, fun, ``)

;(async () => {
  try {
    await themes.init()
    // log.d(mod, fun, `ok`)
  } catch (e) {
    log.w(mod, fun, `Init failed: ${err}`)
  }
})()

module.exports = themes
