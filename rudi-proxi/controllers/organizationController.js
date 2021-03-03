/*
 * This file describes the steps followed for each 
 * action on the organizations (producer or publisher)
 */

 //———————————————————————————————————————————————————————————————
// External dependancies 
//———————————————————————————————————————————————————————————————
const boom = require('@hapi/boom')

const log = require('../utils/logging')
const msg = require('../utils/msg')

const db = require('../db/dbQueries')
const dbRwk = require('../db/dbReworkData')
const json = require('../utils/jsonAccess')

//———————————————————————————————————————————————————————————————
// Constants
//———————————————————————————————————————————————————————————————
const {
  DB_ID,
  API_METADATA_ID,
  API_ORGANIZATION_ID,
  API_CONTACT_ID,
  API_PRODUCER_PROPERTY,
  API_CONTACTS_PROPERTY
} = require('../db/dbFields')

const {
  REQ_LANG,
  REQ_ID
} = require('../routes/apiUrl')

//———————————————————————————————————————————————————————————————
// Data models
//———————————————————————————————————————————————————————————————
const Organization = require('../definitions/models/Organization')


//———————————————————————————————————————————————————————————————
// Controllers
//———————————————————————————————————————————————————————————————

// Add a new organization
exports.addOrganization = async (req, reply) => {
  const fun = 'addOrganization'
  log.d(fun, ``)
  try {

    /* beautify ignore:start */
    let incomingData = {...req.body}
    /* beautify ignore:end */

    const id = json.accessProperty(incomingData, API_ORGANIZATION_ID)

    // First: we make sure id isn't used already
    const existingOrganization = await db.getOrganizationFromJson(incomingData)
    if (existingOrganization && '' != existingOrganization) {
      throw new Error(`${msg.organizationAlreadyExists(id)}`)
    }

    // Creating new organization in db
    const newOrganization = new Organization(incomingData)
    const dbActionResult = await newOrganization.save()
    log.d(fun, `${msg.organizationAdded(id)}`)
    log.d(fun, `dbActionResult: ${dbActionResult}`)
    log.d(fun, `newOrganization: ${newOrganization}`)
  
    return json.removeProperty(dbActionResult, DB_ID)
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

// Get all organization
exports.getEveryOrganization = async (req, reply) => {
  const fun = 'getEveryOrganization'
  log.d(fun, ``)
  try {
    const organizationList = await db.getAllOrganizations()
    return organizationList
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

// Get single organization by ID
exports.getSingleOrganization = async (req, reply) => {
  const fun = 'getSingleOrganization'
  log.d(fun, ``)
  try {
    // Checking if the parameter is ok
    const id = req.params[REQ_ID]
    if (!id || '' == id) {
      throw new Error(`${msg.parameterExpected(REQ_ID)}`)
    }

    const organization = await db.getOrganizationFromRudiId(id)
    if (!organization || '' == organization) {
      throw new Error(`${msg.organizationNotFound(id)}`)
    }

    return organization
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

// Update an existing organization
exports.updateOrganization = async (req, reply) => {
  const fun = 'updateOrganization'
  log.d(fun, ``)
  try {
    /* beautify ignore:start */
    const {...incomingData} = req.body
    /* beautify ignore:end */

    return await db.updateOrganization(incomingData)

  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

// Delete a organization
exports.deleteOrganization = async (req, reply) => {
  const fun = 'deleteOrganization'
  log.d(fun, ``)
  try {
    const id = req.params[REQ_ID]
    if (!id || '' == id) {
      throw new Error(`${msg.parameterExpected(fun, REQ_ID)}`)
    }

    let deletedOrganization = db.deleteOrganization(id)
    return deletedOrganization
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

// Delete every organization
exports.deleteManyOrganization = async (req, reply) => {
  const fun = 'deleteManyOrganization'
  log.d(fun, ``)
  try {
    /* beautify ignore:start */        
    const {...conditions} = req.body
    log.d(fun, conditions)
    /* beautify ignore:end */

    const organization = await Organization.deleteMany(conditions)
    log.d(fun, `deleted organization with condition ${conditions})`)
    return organization
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }

}