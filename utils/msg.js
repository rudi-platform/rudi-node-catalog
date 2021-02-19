//———————————————————————————————————————————————————————————————
// Internal dependancies 
//———————————————————————————————————————————————————————————————
const {
  getLanguage
} = require('../utils/lang')

//———————————————————————————————————————————————————————————————
// Constants
//———————————————————————————————————————————————————————————————
const DEFAULT_MSG = 'Language not found'

//———————————————————————————————————————————————————————————————
// Generic
//———————————————————————————————————————————————————————————————
exports.parameterExpected = (fun, param) => {
  switch (getLanguage()) {
    case 'en':
    case 'en-GB':
    case 'en-US':
      return `The function '${fun}' should be called with a parameter '${param}' `;
    case 'fr':
    case 'fr-FR':
    case 'fr-BE':
      return `La fonction '${fun}' devrait être appelée avec le paramètre '${param}' `;
    default:
      return `${DEFAULT_MSG}: ${getLanguage()}`;
  }
}

exports.missingProperty = (jsonObject, property) => {
  switch (getLanguage()) {
    case 'en':
    case 'en-GB':
    case 'en-US':
      return `The property '${property}' must be defined for object:\n${jsonObject} `;
    case 'fr':
    case 'fr-FR':
    case 'fr-BE':
      return `La propriété '${property}' doit être définie pour l'object:\n${jsonObject} `;
    default:
      return `${DEFAULT_MSG}: ${getLanguage()}`;
  }
}


//———————————————————————————————————————————————————————————————
// Metadata
//———————————————————————————————————————————————————————————————
exports.metadataAlreadyExists = (id) => {
  switch (getLanguage()) {
    case 'en':
    case 'en-GB':
    case 'en-US':
      return `A metadata already exists for id: ${id} `;
    case 'fr':
    case 'fr-FR':
    case 'fr-BE':
      return `Une metadonnée existe déjà pour l'identifiant: ${id} `;
    default:
      return `${DEFAULT_MSG}: ${getLanguage()}`;
  }
}

exports.metadataAdded = (id) => {
  switch (getLanguage()) {
    case 'en':
    case 'en-GB':
    case 'en-US':
      return `New metadata added with id: ${id}`;
    case 'fr':
    case 'fr-FR':
    case 'fr-BE':
      return `Metadonnée ajoutée avec l'identifiant: ${id} `;
    default:
      return `${DEFAULT_MSG}: ${getLanguage()}`;
  }
}

exports.metadataNotFound = (id) => {
  switch (getLanguage()) {
    case 'en':
    case 'en-GB':
    case 'en-US':
      return `No metadata was found with id: ${id} `;
    case 'fr':
    case 'fr-FR':
    case 'fr-BE':
      return `Aucune metadonée trouvée avec l'identifiant: ${id} `;
    default:
      return `${DEFAULT_MSG}: ${getLanguage()}`;
  }
}


//———————————————————————————————————————————————————————————————
// Organization
//———————————————————————————————————————————————————————————————
exports.organizationNotFound = (id) => {
  switch (getLanguage()) {
    case 'en':
    case 'en-GB':
    case 'en-US':
      return `No organization was found with id: ${id} `;
    case 'fr':
    case 'fr-FR':
    case 'fr-BE':
      return `Aucune organisation trouvée avec l'identifiant: ${id} `;
    default:
      return `${DEFAULT_MSG}: ${getLanguage()}`;
  }
}


//———————————————————————————————————————————————————————————————
// Contact
//———————————————————————————————————————————————————————————————
exports.contactNotFound = (id) => {
  switch (getLanguage()) {
    case 'en':
    case 'en-GB':
    case 'en-US':
      return `No contact was found with id: ${id} `;
    case 'fr':
    case 'fr-FR':
    case 'fr-BE':
      return `Aucun contact trouvé avec l'identifiant: ${id} `;
    default:
      return `${DEFAULT_MSG}: ${getLanguage()}`;
  }
}