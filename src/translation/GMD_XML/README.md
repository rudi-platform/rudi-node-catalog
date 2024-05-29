# Translation from GMD-XML (ISO19115/19139) to RUDI.

This document explains how the importation of objects in GMD-XML is done in RUDI. It is intended and was built for the harvesting of a GeoNewtork. See the [translation scheme](../../../doc/translation/GMD_XML.md) used for translation for any information.

## Contacts and Organizations translations :

Contacts (resp. organizations) importation at GMD-XML can be done either with POST/PUT routes api/admin/contacts/?inputStandard=gmd&format=xml (resp. api/admin/organizations?/inputStandard=gmd&format=xml), or either through metadata importation (see below). It is recommended to first import contacts (resp. organizations) through the dedicated routes (api/admin/contacts and api/admin/organizations), and to give them an ID before the importation.

Contacts and organizations are translated with **Object Translators** [GmdXmlToRudiContactTranslator](./contactTranslator.js) and [GmdXmlToRudiOrgaTranslator](./organizationTranslator.js). It searches first for an ID in the incoming metadata (see [configuration file](../../config/confTranslation/GMD_XML/confGMDXML.js)). If an ID is found, the contact (resp. organization) is uploaded in RUDI with this ID; else, it searches a contact (resp. organization) in RUDI with the same **name**. If such a RUDI contact (resp. organization) is found, its ID is taken for the importation. Else, a new UUIDV4 is created, and the contact (resp. organization) is uploaded.

## Metadata translations :

Metadata at GMD-XML can be imported through api/admin/?inputStandard=gmd&format=xml.

Metadata is translated with **Object Translator** [GmdXmlToRudiMetadataTranslator](./metadataTranslator.js). It uses the ID of the incoming metadata (located at path ['gmd:MD_Metadata', 'gmd:fileIdentifer', 'gco:CharacterString']) as the RUDI 'local_id'. That is, it searches for a RUDI metadata with 'local_id' being the ID of the incoming metadata. If such a RUDI metadata is found, RUDI field 'global_id' is set to the global_id of this RUDI metadata. Else, a new 'global_id' (UUIDV4) is created.

Contacts are translated with [GmdXmlToRudiContactTranslator](./contactTranslator.js).

Organizations are translated with [GmdXmlToRudiOrgaTranslator](./organizationTranslator.js).

Media are translated with [GmdXmlToRudiMediaTranslator](./mediaTranslator.js). It first searches to fill the field 'media_id' with an existing ID in the input Metadata. If it is not found, it searches for an existing RUDI media with the same URL as the incoming one. If such a RUDI media is found, its ID is taken. Else, a new UUIDV4 is created
