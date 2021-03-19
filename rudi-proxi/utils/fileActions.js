'use strict';

const mod = '[files]'

//———————————————————————————————————————————————————————————————
// External dependecies
//———————————————————————————————————————————————————————————————
const fs = require('fs')
const ini = require('ini');

//———————————————————————————————————————————————————————————————
// Functions
//———————————————————————————————————————————————————————————————

// Local configuration file extraction
exports.readIniFile = (confFile) => {
  const fun = '[readIniFile]'
  try {
    const fileContent = fs.readFileSync(`./${confFile}`, 'utf-8')
    console.log(mod, fun, `Conf file found at ./${confFile}`)
    const conf = ini.parse(fileContent)
    return conf
  } catch (err) {
    console.error(mod, fun, `${err}`)
  }
}
