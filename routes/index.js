// Import our Controllers
const metadataController = require('../controllers/metadataController')

// Import Swagger documentation
const documentation = require('./documentation/metadataApi')

const urlPrefix = "/api/v1/"
const urlMetadata = `${urlPrefix}resources`

const routes = [
  {
    method: 'GET',
    url: urlMetadata,
    handler: metadataController.getEveryMetadata
  },
  {
    method: 'GET',
    url: `${urlMetadata}/:id`,
    handler: metadataController.getSingleMetadata
  },
  {
    method: 'POST',
    url: `${urlMetadata}`,
    handler: metadataController.addMetadata,
    // schema: documentation.addMetadataSchema
  },
  {
    method: 'PUT',
    url: `${urlMetadata}`,
    handler: metadataController.updateMetadata
  },
  {
    method: 'DELETE',
    url: `${urlMetadata}/:id`,
    handler: metadataController.deleteMetadata
  }
]

module.exports = routes
