/* eslint-disable no-unused-vars */
const {
  DB_ID
} = require('./dbFields')

const ORG_MAP = new Map()
const CONT_MAP = new Map()

/** Replaces an access to the DB by acceding a simple map */
exports.getOrganization = (orgDbId) => {
  if (!ORG_MAP.get(orgDbId)) {
    // retrieve id from db
    // store the id <-> object pair in the ORG_MAP
  }
}
exports.addOrganization = (dbOrganization) => {
  // const orgdbId = addOrganization[DB_ID]
  // if it exists already, let's remove it (but it shouldn't so let's put a warning)
  // add new association

}

exports.updateOrganization = (orgDbId) => {

}

exports.removeOrganization = (orgDbId) => {

}

exports.deleteAllOrganization = () => {

}
