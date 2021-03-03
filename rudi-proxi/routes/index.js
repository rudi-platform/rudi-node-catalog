//———————————————————————————————————————————————————————————————
// Swagger documentation
//———————————————————————————————————————————————————————————————
const documentation = require('./documentation/metadataApi')

//———————————————————————————————————————————————————————————————
// API request constants
//———————————————————————————————————————————————————————————————
const {
  URL_PREFIX,
  URL_SUFIX_REPORT,
  URL_METADATA,
  URL_ORGANIZATIONS,
  URL_CONTACTS,
  URL_SUBJECT,
  REQ_ID,
  REQ_SUBJECT,
  REQ_REPORT_ID
} = require('./apiUrl')


//———————————————————————————————————————————————————————————————
// Controllers
//———————————————————————————————————————————————————————————————
const metadataController = require('../controllers/metadataController')
const organizationController = require('../controllers/organizationController')
const contactController = require('../controllers/contactController')
const reportController = require('../controllers/reportController')

const routes = [
  //———————————————————————————————————————————————————————————————
  // METADATA
  //———————————————————————————————————————————————————————————————
  {
    method: 'GET',
    url: URL_METADATA,
    handler: metadataController.getEveryMetadata
  },
  {
    method: 'GET',
    url: `${URL_METADATA}/:${REQ_ID}`,
    handler: metadataController.getSingleMetadata
  },
  {
    method: 'POST',
    url: URL_METADATA,
    handler: metadataController.addMetadata,
    // schema: documentation.addMetadataSchema
  },
  {
    method: 'PUT',
    url: URL_METADATA,
    handler: metadataController.updateMetadata
  },
  {
    method: 'DELETE',
    url: URL_METADATA,
    handler: metadataController.deleteManyMetadata
  },
  {
    method: 'DELETE',
    url: `${URL_METADATA}/:${REQ_ID}`,
    handler: metadataController.deleteMetadata
  },

  //———————————————————————————————————————————————————————————————
  // ORGANIZATIONS
  //———————————————————————————————————————————————————————————————
  {
    method: 'GET',
    url: URL_ORGANIZATIONS,
    handler: organizationController.getEveryOrganization
  },
  {
    method: 'GET',
    url: `${URL_ORGANIZATIONS}/:${REQ_ID}`,
    handler: organizationController.getSingleOrganization
  },
  {
    method: 'POST',
    url: URL_ORGANIZATIONS,
    handler: organizationController.addOrganization,
    // schema: documentation.addOrganizationSchema
  },
  {
    method: 'PUT',
    url: URL_ORGANIZATIONS,
    handler: organizationController.updateOrganization
  },
  {
    method: 'DELETE',
    url: URL_ORGANIZATIONS,
    handler: organizationController.deleteManyOrganization
  },
  {
    method: 'DELETE',
    url: `${URL_ORGANIZATIONS}/:${REQ_ID}`,
    handler: organizationController.deleteOrganization
  },

  //———————————————————————————————————————————————————————————————
  // CONTACTS
  //———————————————————————————————————————————————————————————————
  {
    method: 'GET',
    url: URL_CONTACTS,
    handler: contactController.getEveryContact
  },
  {
    method: 'GET',
    url: `${URL_CONTACTS}/:${REQ_ID}`,
    handler: contactController.getSingleContact
  },
  {
    method: 'POST',
    url: URL_CONTACTS,
    handler: contactController.addContact,
    // schema: documentation.addContactSchema
  },
  {
    method: 'PUT',
    url: URL_CONTACTS,
    handler: contactController.updateContact
  },
  {
    method: 'DELETE',
    url: URL_CONTACTS,
    handler: contactController.deleteManyContact
  },
  {
    method: 'DELETE',
    url: `${URL_CONTACTS}/:${REQ_ID}`,
    handler: contactController.deleteContact
  },

  //———————————————————————————————————————————————————————————————
  // INTEGRATION REPORTS: Metadata
  //———————————————————————————————————————————————————————————————
  {
    method: 'POST',
    url: `${URL_METADATA}/:${REQ_ID}/${URL_SUFIX_REPORT}`,
    handler: reportController.addReportForSingleMetadata
  },
  {
    method: 'PUT',
    url: `${URL_METADATA}/:${REQ_ID}/${URL_SUFIX_REPORT}`,
    handler: reportController.updateReportForSingleMetadata
  },
  {
    method: 'GET',
    url: `${URL_METADATA}/:${REQ_ID}/${URL_SUFIX_REPORT}`,
    handler: reportController.getEveryReportForSingleMetadata
  },
  {
    method: 'GET',
    url: `${URL_METADATA}/:${REQ_ID}/${URL_SUFIX_REPORT}/:${REQ_REPORT_ID}`,
    handler: reportController.getSingleReportForSingleMetadata
  },
  {
    method: 'GET',
    url: `${URL_METADATA}/${URL_SUFIX_REPORT}`,
    handler: reportController.getEveryReportForEveryMetadata
  },
  {
    method: 'DELETE',
    url: `${URL_METADATA}/:${REQ_ID}/${URL_SUFIX_REPORT}`,
    handler: reportController.deleteEveryReportForSingleMetadata
  },
  {
    method: 'DELETE',
    url: `${URL_METADATA}/:${REQ_ID}/${URL_SUFIX_REPORT}/:${REQ_REPORT_ID}`,
    handler: reportController.deleteSingleReportForSingleMetadata
  },
  {
    method: 'DELETE',
    url: `${URL_METADATA}/${URL_SUFIX_REPORT}`,
    handler: reportController.deleteEveryReportForEveryMetadata
  },

  //———————————————————————————————————————————————————————————————
  // INTEGRATION REPORTS: others
  //———————————————————————————————————————————————————————————————
  {
    method: 'POST',
    url: `${URL_SUBJECT}/:${REQ_ID}/${URL_SUFIX_REPORT}`,
    handler: reportController.addReportForSingleSubject
  },
  {
    method: 'PUT',
    url: `${URL_SUBJECT}/:${REQ_ID}/${URL_SUFIX_REPORT}`,
    handler: reportController.updateReportForSingleSubject
  },
  {
    method: 'GET',
    url: `${URL_SUBJECT}/:${REQ_ID}/${URL_SUFIX_REPORT}`,
    handler: reportController.getEveryReportForSingleSubject
  },
  {
    method: 'GET',
    url: `${URL_SUBJECT}/:${REQ_ID}/${URL_SUFIX_REPORT}/:${REQ_REPORT_ID}`,
    handler: reportController.getSingleReportForSingleSubject
  },
  {
    method: 'GET',
    url: `${URL_SUBJECT}/${URL_SUFIX_REPORT}`,
    handler: reportController.getEveryReportForEverySubject
  },
  {
    method: 'DELETE',
    url: `${URL_SUBJECT}/:${REQ_ID}/${URL_SUFIX_REPORT}`,
    handler: reportController.deleteEveryReportForSingleSubject
  },
  {
    method: 'DELETE',
    url: `${URL_SUBJECT}/:${REQ_ID}/${URL_SUFIX_REPORT}/:${REQ_REPORT_ID}`,
    handler: reportController.deleteSingleReportForSingleSubject
  },
  {
    method: 'DELETE',
    url: `${URL_SUBJECT}/${URL_SUFIX_REPORT}`,
    handler: reportController.deleteEveryReportForEverySubject
  },

]

module.exports = routes