//———————————————————————————————————————————————————————————————
// External dependancies 
//———————————————————————————————————————————————————————————————
const boom = require('@hapi/boom')

//———————————————————————————————————————————————————————————————
// Internal dependancies 
//———————————————————————————————————————————————————————————————
const log = require('../utils/logging')
const msg = require('../utils/msg')

const db = require('../db/dbQueries')


//———————————————————————————————————————————————————————————————
// Constants
//———————————————————————————————————————————————————————————————
const {
  DB_ID,
  DB_METADATA_ID,
  DB_ORGANIZATION_ID,
  DB_CONTACT_ID,
  FIELD_PRODUCER,
  FIELD_CONTACTS
} = require('../db/dbFields')

const {
  REQ_LANG,
  REQ_ID
} = require('../routes/reqParams')


//———————————————————————————————————————————————————————————————
// Data models
//———————————————————————————————————————————————————————————————
const Metadata = require('../definitions/models/Metadata')
const Organization = require('../definitions/models/Organization')
const Contact = require('../definitions/models/Contact')

//———————————————————————————————————————————————————————————————
// Controllers
//———————————————————————————————————————————————————————————————

// Add a new metadata
exports.addMetadata = async (req, reply) => {
  const fun = 'addMetadata'
  log.d(fun, '')
  try {
    /* beautify ignore:start */
    const {body} = req
    const {lang} = req.params

    let metadata = {...body}
    /* beautify ignore:end */

    // Retrieve the name of the field for (meta)data RUDI ID

    // Retrieve the value of the field for this data
    const id = metadata[DB_METADATA_ID]

    log.d(fun, `metadata id: ${id}`)

    // First: we make sure id isn't used already
    const existingMetadata = await Metadata.find({
      [DB_METADATA_ID]: id
    })

    if ('' != existingMetadata) {
      throw new Error(`${msg.metadataAlreadyExists(lang,id)}`)
    }
    // 
    // Getting full info for the organization
    // TODO[VALIDATE]: we assume the organization has previously been created!
    // TODO[VALIDATE]: the organization info already in database is not updated with possible new data
    metadata[FIELD_PRODUCER] = await db.getFullOrganizationFromJson(metadata[FIELD_PRODUCER])

    let fullContacts = []
    for (const contact of metadata[FIELD_CONTACTS]) {
      // TODO[VALIDATE]: we assume the contact has previously been created!
      fullContact = await db.getFullContactFromJson(contact)
      fullContacts.push(fullContact)
    }
    // TODO[VALIDATE]: the contact info already in database is not updated with possible new data
    metadata[FIELD_CONTACTS] = fullContacts
    log.d(fun, `full contacts ${metadata[FIELD_CONTACTS]}`)

    // Creating new metadata
    const newMetadata = new Metadata(metadata)
    const dbActionresult = await newMetadata.save()
    log.d(fun, `${msg.metadataAdded(lang,id)}`)
    return dbActionresult
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

// Get all metadata
exports.getEveryMetadata = async (req, reply) => {
  const fun = 'getEveryMetadata'
  log.d(fun, '')
  const lang = req.params[REQ_LANG]

  try {
    const metadata = Metadata.find()
    log.d(fun, 'all metadata found')
    return metadata
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

// Get single metadata by ID
exports.getSingleMetadata = async (req, reply) => {
  const fun = 'getSingleMetadata'
  log.d(fun, '')

  const lang = req.params[REQ_LANG]
  const id = req.params[REQ_ID]

  try {
    if ('' == id) {
      throw new Error(`${msg.parameterExpected(lang, REQ_ID)}`)
    }
    let metadata = await Metadata.findOne({
      [DB_METADATA_ID]: id
    })
    if ('' == metadata) {
      throw new Error(`${msg.metadataNotFound(lang,id)}`)
    }
    log.d(fun, `found metadata with id ${id}:\n${metadata}`)
    metadata[FIELD_PRODUCER] = await db.getFullOrganizationFromId(metadata[FIELD_PRODUCER])

    log.d(fun, `organization: ${metadata[FIELD_PRODUCER]}`)
    return metadata
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

// Update an existing metadata
exports.updateMetadata = async (req, reply) => {
  const fun = 'updateMetadata'
  log.d(fun, '')
  try {
    /* beautify ignore:start */
    const {...updateData} = req.body
    /* beautify ignore:end */

    const lang = req.params[REQ_LANG]

    const id = req.body[DB_METADATA_ID]
    if (null == id) {
      throw new Error(`id undefined: ${id}`)
    }
    const metadata = await Metadata.findOneAndUpdate({
      [DB_METADATA_ID]: id
    }, updateData, {
      new: true
    })
    if (null == metadata) {
      const errMsg = `couldn't find metadata with id ${id}`
      err = new Error(errMsg)
      throw boom.boomify(err)
    }
    log.d(fun, `updated metadata with id ${id}`)
    return metadata
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

// Delete a metadata
exports.deleteMetadata = async (req, reply) => {
  const fun = 'deleteMetadata'
  log.d(fun, '')
  try {
    const id = req.params[REQ_ID]
    const metadata = await Metadata.findOneAndRemove({
      [DB_METADATA_ID]: id
    })
    if (null == metadata) {
      throw new Error(`couldn't find metadata with id ${id}`)
    }
    log.d(fun, `deleted metadata with id ${id})`)
    return metadata
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }

}

// Delete every metadata
exports.deleteManyMetadata = async (req, reply) => {
  const fun = 'deleteManyMetadata'
  log.d(fun, '')
  try {
    const {
      ...conditions
    } = req.body
    log.d(fun, conditions)
    const metadata = await Metadata.deleteMany(conditions)
    log.d(fun, `deleted metadata with condition ${conditions})`)
    return metadata
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }

}