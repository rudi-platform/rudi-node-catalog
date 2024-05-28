# Translation

This document explains the structure of translation, used to import (and soon export) objects at different standards and format to RUDI.

- Standards means ontology used for the objects fields (e.g. DCAT, RUDI, ISO1915, GMD)
- Format means the way the object is presented (e.g. XML, JSON)

Translation of an object uses instance of class [Translator](./genericTranslator.js), namely [FieldTranslator](./genericTranslator.js) and [ObjectTranslator](./genericTranslator.js).
For each couple (STANDARD, FORMAT) that you want to translate objects from, you need to create instances of Object Translator. An **Object Translator** is used to translate an object at a different standard and/or format than RUDI's ones to RUDI (ex: ISO1915 (GMD-XML) to RUDI; or DCAT to RUDI). It could even be used to make the opposite translation (e.g. RUDI to DCAT).

The structure is the following, an **Object Translator** is used to translate an input Object into RUDI standard (e.g. used to translate metadata, contact, organization, ...). A **Field Translator** is used to translate a specific field of a RUDI object (e.g. field 'global_id' of metadata). These two classes are subclasses of **Translator**.

Each **Field Translator** has a **translation function** (_translationFun_). It's an async function that takes as input: (inputObject, path, args) and outputs the value of corresponding Rudi Field, extracted from inputObject.
The paths and args needed to translate objects and/or fields should be stored in the [conf folder](../config/confTranslation/).
