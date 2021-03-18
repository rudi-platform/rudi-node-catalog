'use strict';

const mod = 'thsCtrl'
/*
 * In this file are made the different steps followed for each 
 * action on the thesaurus
 */

 //———————————————————————————————————————————————————————————————
// External dependancies 
//———————————————————————————————————————————————————————————————
const boom = require('@hapi/boom')
const log = require('../utils/logging')
//———————————————————————————————————————————————————————————————
// Data models
//———————————————————————————————————————————————————————————————
const Thesaurus = require('../definitions/models/ConceptScheme')

//———————————————————————————————————————————————————————————————
// Controllers
//———————————————————————————————————————————————————————————————

// Add a new thesaurus
exports.addThesaurus = async (req, reply) => {
  const fun = 'addThesaurus'
  log.d(mod, fun, '')
  try {
    const id = req.body.thesaurus_id
    log.d(mod, fun, `id: ${id}`)

    // First: we make sure id isn't used already
    const oldThesaurus = await Thesaurus.find({
      'thesaurus_id': id
    })
    if ('' != oldThesaurus) {
      throw new Error(`thesaurus already exists for id ${id}`)
    }

    // Creating new thesaurus
    const newThesaurus = new Thesaurus(req.body)
    log.d(mod, fun, `new thesaurus added with id ${id}`)
    return newThesaurus.save()
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}

// Get all thesaurus
exports.getEveryThesaurus = async (req, reply) => {
  const fun = 'getEveryThesaurus'
  log.d(mod, fun, '')
  try {
    const thesaurus = await Thesaurus.find()
    log.d(mod, fun, 'all thesaurus found')
    return thesaurus
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}

// Get single thesaurus by ID
exports.getSingleThesaurus = async (req, reply) => {
  const fun = 'getSingleThesaurus'
  log.d(mod, fun, '')
  try {
    const id = req.params.id
    const thesaurus = await Thesaurus.find({
      'thesaurus_id': id
    })
    if ('' == thesaurus) {
      throw new Error(`no thesaurus found for id ${id}`)
    }
    log.d(mod, fun, `found thesaurus with id ${id}`)
    return thesaurus
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}

// Update an existing thesaurus
exports.updateThesaurus = async (req, reply) => {
  const fun = 'updateThesaurus'
  log.d(mod, fun, '')
  try {
    const newThesaurus = req.body
    const {
      ...updateData
    } = newThesaurus
    const id = req.body.thesaurus_id
    if (null == id) {
      throw new Error(`id undefined: ${id}`)
    }
    const thesaurus = await Thesaurus.findOneAndUpdate({
      'thesaurus_id': id
    }, updateData, {
      new: true
    })
    if (null == thesaurus) {
      const errMsg = `couldn't find thesaurus with id ${id}`
      err = new Error(errMsg)
      throw err
    }
    log.d(mod, fun, `updated thesaurus with id ${id}`)
    return thesaurus
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}

// Delete a thesaurus
exports.deleteThesaurus = async (req, reply) => {
  const fun = 'deleteThesaurus'
  log.d(mod, fun, '')
  try {
    const id = req.params.id
    const thesaurus = await Thesaurus.findOneAndRemove({
      'thesaurus_id': id
    })
    if (null == thesaurus) {
      throw new Error(`couldn't find thesaurus with id ${id}`)
    }
    log.d(mod, fun, `deleted thesaurus with id ${id})`)
    return thesaurus
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }

}

// Delete every thesaurus
exports.deleteManyThesaurus = async (req, reply) => {
  const fun = 'deleteManyThesaurus'
  log.d(mod, fun, '')
  try {
    const {
      ...conditions
    } = req.body
    log.d(mod, fun, conditions)
    const thesaurus = await Thesaurus.deleteMany(conditions)
    log.d(mod, fun, `deleted thesaurus with condition ${conditions})`)
    return thesaurus
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }

}