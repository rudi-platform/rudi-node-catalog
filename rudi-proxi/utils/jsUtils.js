'use strict';

const mod = 'utils'


//---------------------------------------------------------------
// Dates
//---------------------------------------------------------------
exports.nowISO = () => {
  return new Date().toISOString()
}
exports.nowLocaleFormatted = () => {
  const [date, month, year] = new Date().toLocaleDateString("fr-FR").split("/")
  const [h, m, s] = new Date().toLocaleTimeString("fr-FR").split(/:| /)
  return `${year}/${month}/${date} ${h}:${m}:${s}`
}

//---------------------------------------------------------------
// Arrays
//---------------------------------------------------------------
exports.isNotEmptyArray = (anArray) => {
  return Array.isArray(anArray) && anArray.length > 0
}

//---------------------------------------------------------------
// Objects
//---------------------------------------------------------------
exports.isNotEmptyObject = (obj) => {
  return Object.keys(obj).length > 0
}

//---------------------------------------------------------------
// Basic logging
//---------------------------------------------------------------
exports.separateLogs = (insertStr) => {
  console.log(this.nowLocaleFormatted(), 
  !insertStr?
  `--------------------------------------------------------------------------`:
  `---------------------------------------------------------------[${insertStr}]--`
  )
}
exports.consoleLog = (mod, fun, msg) => {
  const where = !mod?fun:(!fun?mod:`${mod} • ${fun}`)
  const what = (!msg || '' == msg)?'<-':msg
  console.log(this.nowLocaleFormatted(), 'debug', `[${where}]`, what)
}
exports.consoleErr = (mod, fun, msg) => {
  const where = !mod?fun:(!fun?mod:`${mod} • ${fun}`)
  console.error(this.nowLocaleFormatted(), 'error', `[${where}]`, msg.err)
}
