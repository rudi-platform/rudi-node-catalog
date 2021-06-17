export class Thesaurus {
  static code: string
  static initValues: string[]
  static values: string[]

  constructor(code: string, initValues: string[]) {
    code = code,
    Thesaurus.initValues = initValues
    Thesaurus.values = initValues
  }

  static init(values: string[]): void {
    if (!values) Thesaurus.values = Thesaurus.initValues
    else Thesaurus.values = values
  }

  static get() {
    return Thesaurus.values
  }

  static addValue(newVal: string): void {
    newVal = `${newVal}`.trim()
    if (Thesaurus.values.indexOf(newVal) === -1) Thesaurus.values.push(newVal)
  }

  static isValid(val: string, shouldInit: boolean) {
    const isIn = Thesaurus.values.indexOf(val) > -1
    if (!isIn && shouldInit) {
      Thesaurus.addValue(val)
      return true
    }
    return isIn
  }

  static store() {

  }
}
