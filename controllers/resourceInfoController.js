//———————————————————————————————————————————————————————————————
// External Dependancies 
//———————————————————————————————————————————————————————————————
const boom = require('@hapi/boom')

//———————————————————————————————————————————————————————————————
// Data models
//———————————————————————————————————————————————————————————————
const ResourceInfo = require('../models/ResourceInfo')

//———————————————————————————————————————————————————————————————
// Controllers
//———————————————————————————————————————————————————————————————

// Get all metadata
exports.getResourceInfo = async (req, reply) => {
  try {
    const metadata = await ResourceInfo.find()
    return metadata
  } catch (err) {
    throw boom.boomify(err)
  }
}

// Get single metadata by ID
exports.getSingleResourceInfo = async (req, reply) => {
  try {
    const id = req.params.id
    const ResourceInfo = await ResourceInfo.findById(id)
    return ResourceInfo
  } catch (err) {
    throw boom.boomify(err)
  }
}

// Add a new metadata
exports.addResourceInfo = async (req, reply) => {
  console.log('--- addResourceInfo')
  try {
    console.log('--- new ResourceInfo')
    const ResourceInfo = new ResourceInfo(req.body)
    return ResourceInfo.save()
  } catch (err) {
    console.log(`--- ERR: ${err}`)
    throw boom.boomify(err)
  }
}

// Update an existing metadata
exports.updateResourceInfo = async (req, reply) => {
  try {
    const id = req.params.id
    const ResourceInfo = req.body
    const { ...updateData } = ResourceInfo
    const update = await ResourceInfo.findByIdAndUpdate(id, updateData, { new: true })
    return update
  } catch (err) {
    throw boom.boomify(err)
  }
}

// Delete a metadata
exports.deleteResourceInfo = async (req, reply) => {
  try {
    const id = req.params.id
    const ResourceInfo = await ResourceInfo.findByIdAndRemove(id)
    return ResourceInfo
  } catch (err) {
    throw boom.boomify(err)
  }
}