const mod = 'genericTrsltr'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { BadRequestError, RudiError } from '../utils/errors.js'
import { logI } from '../utils/logging.js'
// -------------------------------------------------------------------------------------------------
// Classes that deals with translations of objects and rudi fields.
// -------------------------------------------------------------------------------------------------
export class Translator {
  /**
   * Abstract class dealing with translation to different rudi objects, and fields
   * @param {String} rudiObjectName Rudi type of the object to translate into. (ex: contact, organization, metadata). Can also be a rudi field. (ex: resource_title)
   * @param {Boolean} isMandatory true if the rudi field is mandatory, else false
   * @param {Array[String]} path path in the inputObject to the corresponding rudiObject
   * @param {Object} args args used in translation of the inputObject into rudiObject
   */
  constructor(rudiObjectName, isMandatory = false, path = [], args = {}) {
    this.rudiObjectName = rudiObjectName
    this.isMandatory = isMandatory
    this.path = path
    this.args = args
  }
}

export class FieldTranslator extends Translator {
  /**
   *  Class dealing with translation. Objects of this class translates a particular object field to RUDI. (ex: local_id)
   * @param {String} rudiObjectName the rudi field it translates to
   * @param {AsyncFunction} translationFunc function used to translat atomic rudi fields (i.e. fields that are note objects : e.g. resource_title)
   * @param {Boolean} isMandatory true if the rudi field is mandatory, else false
   * @param {Array[String]} path path in the inputObject to the corresponding rudiObject
   * @param {Object} args args used in translation of the inputObject into rudiObject
   */
  constructor(rudiObjectName, translationFunc, isMandatory = false, path = [], args = {}) {
    super(rudiObjectName, isMandatory, path, args)
    this.translationFunc = translationFunc
  }

  /**
   * Translate the rudi Field this.rudiObjectName with appropriate translation function.
   * @param {*} inputObject the object we want to translate the rudi field from.
   * @returns the translated field
   */
  async translateInputObject(inputObject) {
    const fun = 'FieldTranslator.translateInputObject'
    let result
    try {
      result = await this.translationFunc(inputObject, this.path, this.args)
      return result
    } catch (e) {
      if (this.isMandatory) {
        e.message = `Problem in translation of field '${this.rudiObjectName}'. ${e.message}`
        throw RudiError.treatError(mod, fun, e)
      } else {
        logI(
          mod,
          fun,
          `Non mandatory field ${this.rudiObjectName} was not translated. Following error was raised : '${e}'`
        )
      }
    }
  }
}

export class ObjectTranslator extends Translator {
  /**
   * Class dealing with translation of Objects (like RudiContact, RudiMetadata,... ).
   * @param {String} rudiObjectName The name of the object that an instance of this class translate into. (ex: organization, contacts)
   * @param {String} inputStandard standard of the input object (ex: dcat, rudi)
   * @param {String} inputFormat format of the input object (ex: xml, json)
   * @param {Boolean} isMandatory true if the rudi field is mandatory, else false
   * @param {Array[String]} path path in the inputObject to the corresponding rudiObject
   * @param {Object} args args used in translation of the inputObject into rudiObject
   * @param {Array[Translator]} subTranslators translators for each sub property of the object (ex: rudi object Metadata has a translator with a subTranslator rudi resource_title)
   * @param {Async Function} parser a function that parse an inputObject to js Object before translating it
   */
  constructor(
    rudiObjectName,
    inputStandard,
    inputFormat,
    isMandatory,
    path,
    args,
    subTranslators,
    parser = async (elem) => {
      elem
    }
  ) {
    super(rudiObjectName, isMandatory, path, args)
    this.inputFormat = inputFormat
    this.inputStandard = inputStandard
    this.subTranslators = subTranslators
    this.parser = parser
  }

  /**
   * Translates this.rudiObjectName from inputObject
   * @param {*} inputObject the object to translate
   * @param {Boolean} parse default false, if true the translator parses the inputObject with this.parser before translation.
   * @returns a js object, with fields of this.subTranslators
   */
  async translateInputObject(inputObject, parse = false) {
    const fun = 'ObjectTranslator.translateInputObject'
    let translatedObject = {}
    try {
      if (parse) {
        inputObject = await this.parse(inputObject)
      }
      await Promise.all(
        this.subTranslators.map((subTranslator) =>
          subTranslator
            .translateInputObject(inputObject)
            .then((result) => {
              translatedObject[subTranslator.rudiObjectName] = result
            })
            .catch((e) => {
              throw e
            })
        )
      )
      return translatedObject
    } catch (e) {
      if (this.isMandatory) {
        e.message = `Problem in translation of object '${this.rudiObjectName}'. ${e.message}`
        throw RudiError.treatError(mod, fun, e)
      } else {
        logI(
          mod,
          fun,
          `Non mandatory object ${this.rudiObjectName} was not translated. Following error was raised : '${e}'`
        )
      }
    }
  }

  /**
   * Parse an inputObject into js object.
   * @param {*} inputObject The object to parse
   * @returns a js Object, parsed with this.parser
   */
  async parse(inputObject) {
    const fun = 'ObjectTranslator.parse'
    let result
    try {
      result = await this.parser(inputObject)
      return result
    } catch (e) {
      throw new BadRequestError(
        `Translation to rudi failed. Problem with parsing the object of type : '${this.objectType}', at standard '${this.inputStandard}' and format '${this.inputFormat}'. ${e}`,
        mod,
        fun,
        this.path
      )
    }
  }
}
