'use strict'

// ---------------------------------------------------------------
// Custom schema definition
// ---------------------------------------------------------------

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
  'wind'
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

// ---------------------------------------------------------------
// Getter / setter
// ---------------------------------------------------------------
let Thesaurus = Keywords

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
