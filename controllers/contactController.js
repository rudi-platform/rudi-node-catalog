//———————————————————————————————————————————————————————————————
// External dependancies 
//———————————————————————————————————————————————————————————————
const boom = require('@hapi/boom')
const log = require('../utils/logging')
//———————————————————————————————————————————————————————————————
// Data models
//———————————————————————————————————————————————————————————————
const Contact = require('../definitions/models/Contact')

//———————————————————————————————————————————————————————————————
// Controllers
//———————————————————————————————————————————————————————————————

// Add a new contact
exports.addContact = async (req, reply) => {
  const fun = 'addContact'
  log.d(fun, '')
  try {
    const lang = req.params.lang
    const id = req.body.contact_id
    log.d(fun, `id: ${id}`)

    // First: we make sure id isn't used already
    const oldContact = await Contact.find({
      'contact_id': id
    })
    if ('' != oldContact) {
      throw new Error(`contact already exists for id ${id}`)
    }

    // Creating new contact
    const newContact = new Contact(req.body)
    log.d(fun, `new contact added with id ${id}`)
    return newContact.save()
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

// Get all contact
exports.getEveryContact = async (req, reply) => {
  const fun = 'getEveryContact'
  log.d(fun, '')
  try {
    const lang = req.params.lang
    const contact = await Contact.find()
    log.d(fun, 'all contact found')
    return contact
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

// Get single contact by ID
exports.getSingleContact = async (req, reply) => {
  const fun = 'getSingleContact'
  log.d(fun, '')
  try {
    const lang = req.params.lang
    const id = req.params.id
    const contact = await Contact.findOne({
      'contact_id': id
    })
    if ('' == contact) {
      throw new Error(`no contact found for id ${id}`)
    }
    log.d(fun, `found contact with id ${id}`)
    return contact
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

// Update an existing contact
exports.updateContact = async (req, reply) => {
  const fun = 'updateContact'
  log.d(fun, '')
  try {
    const lang = req.params.lang
    const newContact = req.body
    const {
      ...updateData
    } = newContact
    const id = req.body.contact_id
    if (null == id) {
      throw new Error(`id undefined: ${id}`)
    }
    const contact = await Contact.findOneAndUpdate({
      'contact_id': id
    }, updateData, {
      new: true
    })
    if (null == contact) {
      const errMsg = `couldn't find contact with id ${id}`
      err = new Error(errMsg)
      throw boom.boomify(err)
    }
    log.d(fun, `updated contact with id ${id}`)
    return contact
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }
}

// Delete a contact
exports.deleteContact = async (req, reply) => {
  const fun = 'deleteContact'
  log.d(fun, '')
  try {
    const id = req.params.id
    const contact = await Contact.findOneAndRemove({
      'contact_id': id
    })
    if (null == contact) {
      throw new Error(`couldn't find contact with id ${id}`)
    }
    log.d(fun, `deleted contact with id ${id})`)
    return contact
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }

}

// Delete every contact
exports.deleteManyContact = async (req, reply) => {
  const fun = 'deleteManyContact'
  log.d(fun, '')
  try {
    const {
      ...conditions
    } = req.body
    log.d(fun, conditions)
    const contact = await Contact.deleteMany(conditions)
    log.d(fun, `deleted contact with condition ${conditions})`)
    return contact
  } catch (err) {
    log.e(fun, err)
    throw boom.boomify(err)
  }

}