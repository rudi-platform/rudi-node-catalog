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
  console.log(this.nowLocaleFormatted(), 'debug', `[${where}]`, msg)
}
exports.consoleErr = (mod, fun, msg) => {
  const where = !mod?fun:(!fun?mod:`${mod} • ${fun}`)
  console.error(this.nowLocaleFormatted(), 'error', `[${where}]`, msg.err)
}
