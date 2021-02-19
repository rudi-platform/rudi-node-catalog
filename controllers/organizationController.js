//———————————————————————————————————————————————————————————————
// External dependancies 
//———————————————————————————————————————————————————————————————
const boom = require('@hapi/boom')

const log = require('../utils/logging')
const msg = require('../utils/msg')

const db = require('../db/dbQueries')

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
// Helper functions
//———————————————————————————————————————————————————————————————
async function updateOrganizationJson(organizationJson) {
  const fun = 'updateOrganizationJson'

  // Retrieveing full info for the organization
  // TODO[VALIDATE]: we assume the organization has previously been created!
  const organizationInfo = await db.getOrganizationFromJson(organizationJson)
  if ('' == organizationInfo) {
    throw new Error(`${msg.organizationNotFound(organizationJson[API_ORGANIZATION_ID])}`)
  }

  // Updating incoming data with the full info of the organization
  // TODO[VALIDATE]: The organization info already in database is not updated with possible new data, 
  //                 and only the organization RUDI id is really necessary in the request body
  organizationJson = organizationInfo
  log.d(fun, `Updated organization: ${organizationJson}`)
}


//———————————————————————————————————————————————————————————————
// Controllers
//———————————————————————————————————————————————————————————————

// Add a new organization
exports.addOrganization = async (req, reply) => {
  const fun = 'addOrganization'
  log.d(fun, '')
  try {
    const id = req.body.organization_id
    log.d(fun, `id: ${id}`)

    // First: we make sure id isn't used already
    const oldOrganization = await Organization.find({
      'organization_id': id
    })
    if ('' != oldOrganization) {
      throw new Error(`organization already exists for id ${id}`)
    }

    // Creating new organization
    const newOrganization = new Organization(req.body)
    dbActionResult = await newOrganization.save()
    log.d(fun, `new organization added with id ${id}`)
    return dbActionResult
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

// Get all organization
exports.getEveryOrganization = async (req, reply) => {
  const fun = 'getEveryOrganization'
  log.d(fun, '')
  try {
    const lang = req.params.lang
    const organization = await Organization.find()
    log.d(fun, 'all organization found')
    return organization
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

// Get single organization by ID
exports.getSingleOrganization = async (req, reply) => {
  const fun = 'getSingleOrganization'
  log.d(fun, '')
  try {
    const lang = req.params.lang
    const id = req.params.id
    const organization = await Organization.findOne({
      'organization_id': id
    })
    if ('' == organization) {
      throw new Error(`no organization found for id ${id}`)
    }
    log.d(fun, `found organization with id ${id}`)
    return organization
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

// Update an existing organization
exports.updateOrganization = async (req, reply) => {
  const fun = 'updateOrganization'
  log.d(fun, '')
  try {
    const lang = req.params.lang
    const newOrganization = req.body
    const {
      ...updateData
    } = newOrganization
    const id = req.body.organization_id
    if (null == id) {
      throw new Error(`id undefined: ${id}`)
    }
    const organization = await Organization.findOneAndUpdate({
      'organization_id': id
    }, updateData, {
      new: true
    })
    if (null == organization) {
      const errMsg = `couldn't find organization with id ${id}`
      err = new Error(errMsg)
      throw boom.boomify(err)
    }
    log.d(fun, `updated organization with id ${id}`)
    return organization
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

// Delete a organization
exports.deleteOrganization = async (req, reply) => {
  const fun = 'deleteOrganization'
  log.d(fun, '')
  try {
    const id = req.params.id
    const organization = await Organization.findOneAndRemove({
      'organization_id': id
    })
    if (null == organization) {
      throw new Error(`couldn't find organization with id ${id}`)
    }
    log.d(fun, `deleted organization with id ${id})`)
    return organization
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }

}

// Delete every organization
exports.deleteManyOrganization = async (req, reply) => {
  const fun = 'deleteManyOrganization'
  log.d(fun, '')
  try {
    const {
      ...conditions
    } = req.body
    log.d(fun, conditions)
    const organization = await Organization.deleteMany(conditions)
    log.d(fun, `deleted organization with condition ${conditions})`)
    return organization
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }

}