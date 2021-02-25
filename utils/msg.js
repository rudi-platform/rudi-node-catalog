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
//TODO: store all this in a db

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
      return `New metadata added with id: ${id} `;
    case 'fr':
    case 'fr-FR':
    case 'fr-BE':
      return `Metadonnée ajoutée avec l'identifiant: ${id} `;
    default:
      return `${DEFAULT_MSG}: ${getLanguage()}`;
  }
}

exports.metadataUpdated = (id) => {
  switch (getLanguage()) {
    case 'en':
    case 'en-GB':
    case 'en-US':
      return `Metadata updated for id: ${id} `;
    case 'fr':
    case 'fr-FR':
    case 'fr-BE':
      return `Metadonée mise à jour pour l'identifiant: ${id} `;
    default:
      return `${DEFAULT_MSG}: ${getLanguage()}`;
  }
}

exports.metadataFound = (id) => {
  switch (getLanguage()) {
    case 'en':
    case 'en-GB':
    case 'en-US':
      return `A metadata was found with id: ${id} `;
    case 'fr':
    case 'fr-FR':
    case 'fr-BE':
      return `Une metadonnée a été trouvée avec l'identifiant: ${id} `;
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
      return `Aucune metadonnée trouvée avec l'identifiant: ${id} `;
    default:
      return `${DEFAULT_MSG}: ${getLanguage()}`;
  }
}


exports.metadataDeleted = (id) => {
  switch (getLanguage()) {
    case 'en':
    case 'en-GB':
    case 'en-US':
      return `Metadata deleted for id: ${id} `;
    case 'fr':
    case 'fr-FR':
    case 'fr-BE':
      return `Métadonnée supprimée pour l'identifiant: ${id} `;
    default:
      return `${DEFAULT_MSG}: ${getLanguage()}`;
  }
}

exports.metadataDeletedWithCondition = (condition) => {
  switch (getLanguage()) {
    case 'en':
    case 'en-GB':
    case 'en-US':
      return `Metadata deleted for condition: '${condition}'`;
    case 'fr':
    case 'fr-FR':
    case 'fr-BE':
      return `Métadonnées supprimées pour la condition: '${condition}'`;
    default:
      return `${DEFAULT_MSG}: ${getLanguage()}`;
  }
}
//———————————————————————————————————————————————————————————————
// Organization
//———————————————————————————————————————————————————————————————
exports.organizationAdded = (id) => {
  switch (getLanguage()) {
    case 'en':
    case 'en-GB':
    case 'en-US':
      return `New organization added with id: ${id} `;
    case 'fr':
    case 'fr-FR':
    case 'fr-BE':
      return `Organisation créée avec l'identifiant: ${id} `;
    default:
      return `${DEFAULT_MSG}: ${getLanguage()}`;
  }
}
exports.organizationAlreadyExists = (id) => {
  switch (getLanguage()) {
    case 'en':
    case 'en-GB':
    case 'en-US':
      return `An organization already exists for id: ${id} `;
    case 'fr':
    case 'fr-FR':
    case 'fr-BE':
      return `Une organisation existe déjà pour l'identifiant: ${id} `;
    default:
      return `${DEFAULT_MSG}: ${getLanguage()}`;
  }
}

exports.organizationUpdated = (id) => {
  switch (getLanguage()) {
    case 'en':
    case 'en-GB':
    case 'en-US':
      return `Organization updated for id: ${id} `;
    case 'fr':
    case 'fr-FR':
    case 'fr-BE':
      return `Organisation mise à jour pour l'identifiant: ${id} `;
    default:
      return `${DEFAULT_MSG}: ${getLanguage()}`;
  }
}

exports.organizationDeleted = (id) => {
  switch (getLanguage()) {
    case 'en':
    case 'en-GB':
    case 'en-US':
      return `Organization deleted for id: ${id} `;
    case 'fr':
    case 'fr-FR':
    case 'fr-BE':
      return `Organisation supprimée pour l'identifiant: ${id} `;
    default:
      return `${DEFAULT_MSG}: ${getLanguage()}`;
  }
}

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
exports.contactAdded = (id) => {
  switch (getLanguage()) {
    case 'en':
    case 'en-GB':
    case 'en-US':
      return `New contact added with id: ${id} `;
    case 'fr':
    case 'fr-FR':
    case 'fr-BE':
      return `Contact créé avec l'identifiant: ${id} `;
    default:
      return `${DEFAULT_MSG}: ${getLanguage()}`;
  }
}

exports.contactAlreadyExists = (id) => {
  switch (getLanguage()) {
    case 'en':
    case 'en-GB':
    case 'en-US':
      return `A contact already exists for id: ${id} `;
    case 'fr':
    case 'fr-FR':
    case 'fr-BE':
      return `Un contact existe déjà pour l'identifiant: ${id} `;
    default:
      return `${DEFAULT_MSG}: ${getLanguage()}`;
  }
}

exports.contactUpdated = (id) => {
  switch (getLanguage()) {
    case 'en':
    case 'en-GB':
    case 'en-US':
      return `Contact updated for id: ${id} `;
    case 'fr':
    case 'fr-FR':
    case 'fr-BE':
      return `Contact mis à jour pour l'identifiant: ${id} `;
    default:
      return `${DEFAULT_MSG}: ${getLanguage()}`;
  }
}


exports.contactDeleted = (id) => {
  switch (getLanguage()) {
    case 'en':
    case 'en-GB':
    case 'en-US':
      return `Contact deleted for id: ${id} `;
    case 'fr':
    case 'fr-FR':
    case 'fr-BE':
      return `Contact supprimé pour l'identifiant: ${id} `;
    default:
      return `${DEFAULT_MSG}: ${getLanguage()}`;
  }
}
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
