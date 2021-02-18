const DEFAULT_MSG = 'Language not found'

exports.metadataAlreadyExists = (lang, id) => {
  switch (lang) {
    case 'en':
    case 'en-GB':
    case 'en-US':
      return `A metadata already exists for id: ${id}`;
    case 'fr':
    case 'fr-FR':
    case 'fr-BE':
      return `Une metadonnée existe déjà pour l'identifiant: ${id}`;
    default:
      return `${DEFAULT_MSG}: ${lang}`;
  }
}

exports.metadataAdded = (lang, id) => {
  switch (lang) {
    case 'en':
    case 'en-GB':
    case 'en-US':
      return `New metadata added with id: ${id}`;
    case 'fr':
    case 'fr-FR':
    case 'fr-BE':
      return `Metadonnée ajoutée avec l'identifiant: ${id}`;
    default:
      return `${DEFAULT_MSG}: ${lang}`;
  }
}

exports.metadataNotFound = (lang, id) => {
  switch (lang) {
    case 'en':
    case 'en-GB':
    case 'en-US':
      return `No metadata was found for id ${id}`;
    case 'fr':
    case 'fr-FR':
    case 'fr-BE':
      return `Aucune metadonée trouvée avec l'identifiant: ${id}`;
    default:
      return `${DEFAULT_MSG}: ${lang}`;
  }
}


exports.parameterExpected = (lang, param) => {
  switch (lang) {
    case 'en':
    case 'en-GB':
    case 'en-US':
      return `This function should be called with a parameter ${param}`;
    case 'fr':
    case 'fr-FR':
    case 'fr-BE':
      return `Cetet fonction devrait être appelée avec le paramètre: ${param}`;
    default:
      return `${DEFAULT_MSG}: ${lang}`;
  }
}



