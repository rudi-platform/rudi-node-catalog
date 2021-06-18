const mod = 'thesObj'

import log from '../../utils/logging'
import { parameterExpected } from '../../utils/msg'

export class Thesaurus {
  static code: string
  static initValues: string[]
  static values: string[]

  constructor(code: string, initValues: string[]) {
    ;(code = code), (Thesaurus.initValues = initValues)
    Thesaurus.values = initValues
  }

  static init(values: string[]): void {
    if (!values) Thesaurus.values = Thesaurus.initValues
    else Thesaurus.values = values
  }

  static get() {
    return Thesaurus.values
  }

  static addValue(newValue: string): void {
    const fun = 'addValue'
    try {
      if (!newValue) {
        const errMsg = parameterExpected(fun, 'newValue')
        log.w(mod, fun, errMsg)
        throw new Error(errMsg)
      }
      newValue = `${newValue}`.trim()
      if (Thesaurus.values.indexOf(newValue) === -1) Thesaurus.values.push(newValue)
    } catch (err) {
      log.w(mod, fun, err)
      throw err
    }
  }

  static isValid(val: string, shouldInit: boolean) {
    const fun = 'isValid'
    try {
      if (!val) {
        log.w(mod, fun, parameterExpected(fun, 'value'))
        return false
      }
      const isIn = Thesaurus.values.indexOf(val) > -1
      if (!isIn && shouldInit) {
        Thesaurus.addValue(val)
        return true
      }
      return isIn
    } catch (err) {
      log.w(mod, fun, err)
      throw err
    }
  }

  static store() {}
}
