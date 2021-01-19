//———————————————————————————————————————————————————————————————
// External Dependancies 
//———————————————————————————————————————————————————————————————
const boom = require('@hapi/boom')

//———————————————————————————————————————————————————————————————
// Data models
//———————————————————————————————————————————————————————————————
const Metadata = require('../models/Metadata')

//———————————————————————————————————————————————————————————————
// Controllers
//———————————————————————————————————————————————————————————————

// Get all metadata
exports.getMetadata = async (req, reply) => {
  try {
    console.log('--- getAllMetadata')
    const metadata = await Metadata.find()
    return metadata
  } catch (err) {
    throw boom.boomify(err)
  }
}

// Get single metadata by ID
exports.getSingleMetadata = async (req, reply) => {
  try {
    const id = req.params.id
    console.log('--- getMetadata')
    const metadata = await Metadata.findById(id)
    return metadata
  } catch (err) {
    throw boom.boomify(err)
  }
}

// Add a new metadata
exports.addMetadata = async (req, reply) => {
  try {
    console.log('--- addMetadata')
    const metadata = new Metadata(req.body)
    return metadata.save()
  } catch (err) {
    console.log(`--- ERR: ${err}`)
    throw boom.boomify(err)
  }
}

// Update an existing metadata
exports.updateMetadata = async (req, reply) => {
  try {
    const id = req.params.id
    const metadata = req.body
    const { ...updateData } = metadata
    console.log('--- setMetadata')
    const update = await Metadata.findByIdAndUpdate(id, updateData, { new: true })
    return update
  } catch (err) {
    throw boom.boomify(err)
  }
}

// Delete a metadata
exports.deleteMetadata = async (req, reply) => {
  try {
    const id = req.params.id
    console.log('--- delMetadata')
    const Metadata = await Metadata.findByIdAndRemove(id)
    return Metadata
  } catch (err) {
    throw boom.boomify(err)
  }
}