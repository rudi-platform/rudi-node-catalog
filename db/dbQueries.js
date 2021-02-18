//———————————————————————————————————————————————————————————————
// Internal dependencies
//———————————————————————————————————————————————————————————————
const log = require('../utils/logging')

const dbLabels = require('./dbFields')

const Organization = require('../definitions/models/Organization')
const Contact = require('../definitions/models/Contact')

//———————————————————————————————————————————————————————————————
// Factorized functions
//———————————————————————————————————————————————————————————————

async function getFullInfoFromJson(jsonObject, labelIdField, dbModel) {
  const fun = 'getFullInfoFromJson'
  let fullInfo = ''

  const id = jsonObject[labelIdField]
  if (!id)
    throw new Error(`Input object doesn't have such field: '${labelIdField}'\n object: ${jsonObject}`)

  log.d(fun, `${labelIdField}: ${id}`)

  try {
    fullInfo = await dbModel.findOne({
      [labelIdField]: id
    })
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }

  if ('' == fullInfo) {
    throw new Error(`Object doesn't exist with ${labelIdField}: ${id}`)
  }
  log.d(fun, `full info: ${fullInfo}`)
  return fullInfo
}

async function getFullInfoFromDbId(id, dbModel) {
  const fun = 'getFullInfoFromDbId'
  let fullInfo = ''

  fullInfo = await dbModel.findOne({
    [dbLabels.DB_ID]: id
  })
  if ('' == fullInfo) {
    throw new Error(`Object doesn't exist with _id: ${id}`)
  }
  log.d(fun, `full info: ${fullInfo}`)
  return fullInfo
}

//———————————————————————————————————————————————————————————————
// Access to specific fields
//———————————————————————————————————————————————————————————————

//----- Organization
async function getFullOrganizationFromJson(organizationJson) {
  return getFullInfoFromJson(organizationJson, dbLabels.DB_ORGANIZATION_ID, Organization)
}
async function getFullOrganizationFromId(id) {
  return getFullInfoFromDbId(id, Organization)
}

//----- Contacts
async function getFullContactFromJson(contactJson) {
  return getFullInfoFromJson(contactJson, dbLabels.DB_CONTACT_ID, Contact)
}
async function getFullContactFromId(id) {
  return getFullInfoFromDbId(id, Contact)
}


//———————————————————————————————————————————————————————————————
// Exports
//———————————————————————————————————————————————————————————————

module.exports = {
  getFullInfoFromJson,
  getFullInfoFromDbId,
  getFullOrganizationFromJson,
  getFullOrganizationFromId,
  getFullContactFromJson,
  getFullContactFromId
}