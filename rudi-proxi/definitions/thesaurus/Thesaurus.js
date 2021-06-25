'use strict'

const mod = 'thsrClass'

// -----------------------------------------------------------------------------
// Internal dependencies
// -----------------------------------------------------------------------------
const log = require('../../utils/logging')
const { beautify } = require('../../utils/jsUtils')
const { parameterExpected } = require('../../utils/msg')

const DynamicEnum = require('../models/DynamicEnum')

// -----------------------------------------------------------------------------
// Thesaurus class
// -----------------------------------------------------------------------------
module.exports = class Thesaurus {
  #isInit
  #code
  #initValues
  #currentValues

  /**
   *
   * @param {string} code Identifier for this enum
   * @param {string[]} initValues Default values to be used when none are provided
   */
  constructor(code, initValues) {
    const fun = 'constructor'
    // log.d(mod, fun, `${code}`)

    this.#isInit = false
    this.#code = code
    this.#initValues = initValues
  }

  /**
   * Initialize the enum values
   * Should be called only once
   * If no DB values are found, object initValues are used
   * @param {*} shouldReset If true, values are reset
   */
  init = async (shouldReset) => {
    const fun = 'init'
    // log.d(mod, fun, `Thesaurus: ${this.#code}`)
    if (this.#isInit) throw new Error('Init should be called only once.')

    if (shouldReset) {
      this.#currentValues = []
      await this.#storeCurrentValues()
    } else {
      try {
        await this.#retrieveDbValues()
      } catch (err) {
        log.d(mod, fun, 'No values found in DB')
        this.#currentValues = this.#initValues
        await this.#storeCurrentValues()
      }
    }
    this.#isInit = true
    // log.d(mod, fun, `Thesaurus initialized: ${this.#code}`)
  }

  get() {
    const fun = 'get'
    if (this.#isInit) {
      return this.#currentValues
    } else {
      const errMsg = 'Init first'
      log.w(mod, fun, errMsg)
      throw new Error(errMsg)
    }
  }

  addSingleValue = async (newValue) => {
    const fun = 'addSingleValue'
    try {
      if (!this.#isInit) throw new Error('Init first')
      if (!newValue) {
        const errMsg = parameterExpected(fun, 'newValue')
        log.w(mod, fun, errMsg)
        throw new Error(errMsg)
      }

      newValue = `${newValue}`.trim()
      if (this.#currentValues.indexOf(newValue) === -1) {
        this.#currentValues.push(newValue)
        await this.#storeCurrentValues()
      }
    } catch (err) {
      log.w(mod, fun, err)
      throw err
    }
  }

  isValid = async (val, shouldInit) => {
    const fun = 'isValid'
    try {
      if (!this.#isInit) throw new Error('Init first')

      if (!val) {
        log.w(mod, fun, parameterExpected(fun, 'value'))
        return false
      }
      const isIn = this.#currentValues.indexOf(val) > -1
      if (!isIn && shouldInit) {
        await this.addSingleValue(val)
        return true
      }
      return isIn
    } catch (err) {
      log.w(mod, fun, err)
      throw err
    }
  }

  #retrieveDbValues = async () => {
    const fun = 'retrieveDbValues'
    try {
      const dbValues = await this.#getEnum(this.#code)
      if (dbValues) {
        this.#currentValues = dbValues
      } else {
        throw new Error(`No values found for thesaurus '${this.#code}'`)
      }
    } catch (err) {
      log.d(mod, fun, err)
      throw err
    }
  }

  #storeCurrentValues = async () => {
    const fun = 'storeCurrentValues'
    try {
      if (!this.#currentValues) throw new Error('Values not inititalized')
      await this.#storeEnum(this.#code, this.#currentValues)
    } catch (err) {
      log.w(mod, fun, err)
      throw err
    }
  }

  #getEnum = async (typeThesaurus) => {
    const fun = 'getEnum'
    // log.d(mod, fun, ``)

    try {
      const dbEnum = await DynamicEnum.findOne({ code: typeThesaurus })
      if (dbEnum) return dbEnum.values
      else throw new Error(`Enum '${typeThesaurus}' was not found`)
    } catch (err) {
      log.d(mod, fun, err)
      throw err
    }
  }

  #storeEnum = async (typeThesaurus, listValues) => {
    const fun = 'storeEnum'
    log.d(mod, fun, ``)

    try {
      const dbEnum = await DynamicEnum.findOneAndUpdate(
        { code: typeThesaurus },
        { $set: { values: listValues } },
        { upsert: true, new: true }
      )
    } catch (err) {
      log.w(mod, fun, err)
      throw err
    }
  }
}
