'use strict';

const mod = 'utils'


//———————————————————————————————————————————————————————————————
// Dates
//———————————————————————————————————————————————————————————————
exports.nowISO = () => {
  return new Date().toISOString()
}
exports.nowLocaleFormatted = () => {
  const [date, month, year] = new Date().toLocaleDateString("fr-FR").split("/")
  const [h, m, s] = new Date().toLocaleTimeString("fr-FR").split(/:| /)
  return `${year}/${month}/${date} ${h}:${m}:${s}`
}

//———————————————————————————————————————————————————————————————
// Basic logging
//———————————————————————————————————————————————————————————————
exports.separateLogs = (insertStr) => {
  console.log(this.nowLocaleFormatted(), 
  !insertStr?
  `--------------------------------------------------------------------------`:
  `---------------------------------------------------------------[${insertStr}]--`
  )
}
exports.consoleLog = (mod, fun, action) => {
  const where = !mod?fun:(!fun?mod:`${mod} • ${fun}`)
  console.log(this.nowLocaleFormatted(), 'debug', `[${where}]`, action)
}
exports.consoleErr = (mod, fun, action) => {
  const where = !mod?fun:(!fun?mod:`${mod} • ${fun}`)
  console.err(this.nowLocaleFormatted(), 'error', `[${where}]`, action)
}
//———————————————————————————————————————————————————————————————
// Tests
//———————————————————————————————————————————————————————————————
exports.isNotEmptyArray = (anArray) => {
  return Array.isArray(anArray) && anArray.length > 0
}
