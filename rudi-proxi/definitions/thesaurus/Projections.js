'use strict'

// -----------------------------------------------------------------------------
// Custom schema definition
// -----------------------------------------------------------------------------
const Projections = [
  'RGF93/Lambert-93 (EPSG:2154)', // https://www.spatialreference.org/ref/epsg/2154/
  'RGF93/CC48 (EPSG:3948)', // https://www.spatialreference.org/ref/epsg/3948/
  'WGS 84', // https://www.spatialreference.org/ref/epsg/4326/ urn:ogc:def:crs:OGC::CRS84
]

// -----------------------------------------------------------------------------
// Getter / setter
// -----------------------------------------------------------------------------
let Thesaurus = Projections

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
