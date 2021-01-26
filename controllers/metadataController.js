//———————————————————————————————————————————————————————————————
// External dependancies 
//———————————————————————————————————————————————————————————————
const boom = require('@hapi/boom')
const log = require('../utils/logging')
//———————————————————————————————————————————————————————————————
// Data models
//———————————————————————————————————————————————————————————————
const Metadata = require('../definitions/models/Metadata')

//———————————————————————————————————————————————————————————————
// Controllers
//———————————————————————————————————————————————————————————————

// Add a new metadata
exports.addMetadata = async (req, reply) => {
  const fName = 'addMetadata'
  log.d(fName, '')
  try {
    const id = req.body.global_id
    log.d(fName, `id: ${id}`)

    // First: we make sure id isn't used already
    const oldMetadata = await Metadata.find({'global_id':id})
    if('' != oldMetadata) {
      throw new Error(`metadata already exists for id ${id}`)
    }

    // Creating new metadata
    const newMetadata = new Metadata(req.body)
    log.d(fName, `new metadata added with id ${id}`)
    return newMetadata.save()
  } catch (err) {
    log.e(fName, err)
    throw boom.boomify(err)
  }
}

// Get all metadata
exports.getEveryMetadata = async (req, reply) => {
  const fName = 'getEveryMetadata'
  log.d(fName, '')
  try {
    const metadata = await Metadata.find()
    log.d(fName,'all metadata found')
    return metadata
  } catch (err) {
    log.e(fName, err)
    throw boom.boomify(err)
  }
}

// Get single metadata by ID
exports.getSingleMetadata = async (req, reply) => {
  const fName = 'getSingleMetadata'
  log.d(fName, '')
  try {
    const id = req.params.id
    const metadata = await Metadata.find({'global_id':id})
    if('' == metadata ){
      throw new Error(`no metadata found for id ${id}`)
    }
    log.d(fName, `found metadata with id ${id}`)
    return metadata
  } catch (err) {
    log.e(fName, err)
    throw boom.boomify(err)
  }
}

// Update an existing metadata
exports.updateMetadata = async (req, reply) => {
  const fName = 'updateMetadata'
  log.d(fName, '')
  try {
    const newMetadata = req.body
    const { ...updateData } = newMetadata
    const id = req.body.global_id
    if(null == id) {
      throw new Error(`id undefined: ${id}`)
    }
    const metadata = await Metadata.findOneAndUpdate({'global_id':id}, updateData, { new: true })
    if(null == metadata) {
      const errMsg = `couldn't find metadata with id ${id}`
      err = new Error(errMsg)
      throw boom.boomify(err)
    }
    log.d(fName, `updated metadata with id ${id}`)
    return metadata
  } catch (err) {
    log.e(fName, err)
    throw boom.boomify(err)
  }
}

// Delete a metadata
exports.deleteMetadata = async (req, reply) => {
  const fName = 'deleteMetadata'
  log.d(fName, '')
  try {
    const id = req.params.id
    const metadata = await Metadata.findOneAndRemove({'global_id':id})
    if(null == metadata) {
      throw new Error(`couldn't find metadata with id ${id}`)
    }
    log.d(fName, `deleted metadata with id ${id})`)
    return metadata
  } catch (err) {
    log.e(fName, err)
    throw boom.boomify(err)
  }

}