'use strict';

const mod = 'confSkos'

//---------------------------------------------------------------
//  Internal dependancies 
//---------------------------------------------------------------
const Encodings = require("../definitions/thesaurus/Encodings");
const FileTypes = require("../definitions/thesaurus/FileTypes");
const HashAlgorithms = require("../definitions/thesaurus/HashAlgorithms");
const Keywords = require("../definitions/thesaurus/Keywords");
const Languages = require("../definitions/thesaurus/Languages");
const Projections = require("../definitions/thesaurus/Projections");
const Themes = require("../definitions/thesaurus/Themes");


//---------------------------------------------------------------
// Thesauri
//---------------------------------------------------------------
exports.Thesauri = {
  "Encodings": Encodings,
  "FileTypes": FileTypes,
  "HashAlgorithms": HashAlgorithms,
  "Keywords": Keywords,
  "Languages": Languages,
  "Projections": Projections,
  "Themes": Themes
}

//---------------------------------------------------------------
//  Licence
//---------------------------------------------------------------
exports.LicenceSchemeCode = "software_licences"
exports.LicenceConceptRole = "licence"