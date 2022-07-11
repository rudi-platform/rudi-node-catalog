const mod = 'files'

// ------------------------------------------------------------------------------------------------
// External dependecies
// ------------------------------------------------------------------------------------------------
import { readFileSync } from 'fs'
import { parse } from 'ini'
import { consoleErr } from './jsUtils.mjs'

// ------------------------------------------------------------------------------------------------
// Functions
// ------------------------------------------------------------------------------------------------

// Local configuration file extraction
export const readIniFile = (confFile) => {
  const fun = 'readIniFile'
  try {
    const fileContent = readFileSync(`${confFile}`, 'utf-8')
    // utils.consoleLog(mod, fun, `Conf file: ${confFile}`)
    const conf = parse(fileContent)
    return conf
  } catch (err) {
    consoleErr(mod, fun, `Couldn't read file '${confFile}': ${err}`)
    throw new Error(`Couldn't read file '${confFile}': ${err}`)
  }
}
