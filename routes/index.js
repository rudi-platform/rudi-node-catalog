// Import our Controllers
const metadataController = require('../controllers/metadataController')
const organizationController = require('../controllers/organizationController')
const contactController = require('../controllers/contactController')

// Import Swagger documentation
const documentation = require('./documentation/metadataApi')

const urlPrefix = "/api/v1/"
const urlMetadata = `${urlPrefix}:lang/resources`
const urlOrganization = `${urlPrefix}organizations`
const urlContact = `${urlPrefix}contacts`

const routes = [
  //————————————— METADATA ———————————————
  {
    method: 'GET',
    url: `${urlMetadata}`,
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
    url: `${urlMetadata}`,
    handler: metadataController.deleteManyMetadata
  },
  {
    method: 'DELETE',
    url: `${urlMetadata}/:id`,
    handler: metadataController.deleteMetadata
  },
  //————————————— ORGANIZATIONS ———————————————
  {
    method: 'GET',
    url: urlOrganization,
    handler: organizationController.getEveryOrganization
  },
  {
    method: 'GET',
    url: `${urlOrganization}/:id`,
    handler: organizationController.getSingleOrganization
  },
  {
    method: 'POST',
    url: `${urlOrganization}`,
    handler: organizationController.addOrganization,
    // schema: documentation.addOrganizationSchema
  },
  {
    method: 'PUT',
    url: `${urlOrganization}`,
    handler: organizationController.updateOrganization
  },
    {
    method: 'DELETE',
    url: `${urlOrganization}`,
    handler: organizationController.deleteManyOrganization
  },
  {
    method: 'DELETE',
    url: `${urlOrganization}/:id`,
    handler: organizationController.deleteOrganization
  }, 
  //————————————— CONTACTS ———————————————
  {
    method: 'GET',
    url: urlContact,
    handler: contactController.getEveryContact
  },
  {
    method: 'GET',
    url: `${urlContact}/:id`,
    handler: contactController.getSingleContact
  },
  {
    method: 'POST',
    url: `${urlContact}`,
    handler: contactController.addContact,
    // schema: documentation.addContactSchema
  },
  {
    method: 'PUT',
    url: `${urlContact}`,
    handler: contactController.updateContact
  },
    {
    method: 'DELETE',
    url: `${urlContact}`,
    handler: contactController.deleteManyContact
  },
  {
    method: 'DELETE',
    url: `${urlContact}/:id`,
    handler: contactController.deleteContact
  },
]

module.exports = routes