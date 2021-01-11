// Import our Controllers
const resourceInfoController = require('../controllers/resourceInfoController')

// Import Swagger documentation
const documentation = require('./documentation/resourceInfoApi')

const routes = [
  {
    method: 'GET',
    url: '/api/ResourceInfos',
    handler: resourceInfoController.getResourceInfo
  },
  {
    method: 'GET',
    url: '/api/ResourceInfos/:id',
    handler: resourceInfoController.getSingleResourceInfo
  },
  {
    method: 'POST',
    url: '/api/ResourceInfos',
    handler: resourceInfoController.addResourceInfo,
    // schema: documentation.addResourceInfoSchema
  },
  {
    method: 'PUT',
    url: '/api/ResourceInfos/:id',
    handler: resourceInfoController.updateResourceInfo
  },
  {
    method: 'DELETE',
    url: '/api/ResourceInfos/:id',
    handler: resourceInfoController.deleteResourceInfo
  }
]

module.exports = routes
