import { v4 } from 'uuid'

export class UUIDv4 {
  protected str: string
  static readonly REGEX = new RegExp(/^[0-9]{8}-[0-9]{4}-4[0-9]{3}-[89ab][0-9]{3}-[0-9]{12}$/i)

  constructor(str?: string) {
    if (!str) {
      this.str = UUIDv4.getNewGUIDString()
    } else {
      if (UUIDv4.isValid(str)) {
        this.str = str
      } else {
        throw new Error('Error: invalid UUID !')
      }
    }
  }

  toString() {
    return this.str
  }

  static isValid(str: string) {
    return str.match(UUIDv4.REGEX)
  }

  private static getNewGUIDString() {
    // alternative : https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid/65500983#answer-65500983
    return v4()
  }

  /*
  type UUIDv4 = string & { _guidBrand: undefined };

  function makeGuid(text: string): UUIDv4 {
    // todo: add some validation and normalization here
    return text as UUIDv4;
  }

  const someValue = "someString";
  const myGuid = makeGuid("ef3c1860-5ce6-47af-a13d-1ed72f65b641");

  // expectsGuid(someValue); // error, good
  expectsGuid(myGuid); // ok, good

  function expectsGuid(guid: UUIDv4) {
  } 
  */
}
