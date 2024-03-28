const mod = 'genericTrsltr'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { BadRequestError, RudiError } from '../utils/errors.js'

// -------------------------------------------------------------------------------------------------
// Classes that deals with translation of objects
// -------------------------------------------------------------------------------------------------
export class ObjectTranslator {
  /**
   * Class dealing with translation to different rudi objects.
   * @param {String} objectType Rudi type of the object to translate into. (ex: contact, organization, metadata)
   * @param {String} inputStandard standard of the input object (ex: dcat, rudi)
   * @param {String} inputFormat format of the input object (ex: xml, json)
   * @param {Array[FieldTranslator]} fieldsTranslators translators for each field of the rudi object
   * @param {Function} parser function used to parse. Default is identity function
   */
  constructor(
    objectType,
    inputStandard,
    inputFormat,
    fieldsTranslators,
    parser = async (inputObject) => {
      inputObject
    }
  ) {
    this.objectType = objectType
    this.inputStandard = inputStandard
    this.inputFormat = inputFormat
    this.fieldsTranslators = fieldsTranslators
    this.parser = parser
  }

  /**
   * Translate the inputObject. If parse===true, the translator starts by parsing the object.
   * @param {String || Object} inputObject
   * @param {Boolean} parse
   * @returns the translated object
   */
  async translate(inputObject, parse = false) {
    const fun = 'translate'
    let oldObject = inputObject
    if (parse) {
      try {
        oldObject = await this.parse(inputObject)
      } catch (e) {
        throw new RudiError(e)
      }
    }
    const newObject = {}
    for await (const elem of this.fieldsTranslators) {
      newObject[elem.rudiField] = await elem.translate(oldObject)
      // logI(mod, fun, await elem.translate(oldObject))
    }
    // await this.fieldsTranslators.forEach((elem) => {
    //   newObject[elem.rudiField] = elem.translate(oldObject)
    // })
    return newObject
  }

  async parse(inputObject) {
    const fun = 'ObjectTranslator.parse'
    let inputObjectParsed
    try {
      inputObjectParsed = await this.parser(inputObject) // parse from xml to js Object
      // logI(mod, fun, 'success parsing')
    } catch (e) {
      throw new BadRequestError(
        `Translation to rudi failed. Problem with parsing the object : ${this.objectType}, at standard ${this.inputStandard} and format ${this.inputFormat}. Error: ${e}`,
        mod,
        fun
      )
    }
    return inputObjectParsed
  }
}

export class FieldTranslator {
  /**
   *  Class dealing with translation. Objects of this class translates a particular object field to RUDI. (ex: local_id)
   * @param {String} rudiField the rudi field it translates to
   * @param {Function} translationFunc the function to use for translation. It must take 3 args. 1st is origin Object, second is path, third is other args in an array.
   * @param {Object} params parameters (like path) to use to translate object field. Must have property path.
   */
  constructor(rudiField, translationFunc, params) {
    this.rudiField = rudiField
    this.translationFunc = translationFunc
    this.params = params
  }
  async translate(inputObject) {
    const fun = 'translate'

    const path = this.params.path // !! potentially === undefined
    const args = this.params.args // !! potentially === undefined
    let result
    try {
      result = await this.translationFunc(inputObject, path, args)
    } catch (err) {
      throw new BadRequestError(
        `Problem in translation of field: ${this.rudiField}. Error : ${err}`,
        mod,
        fun
      )
    }
    return result
  }
}
