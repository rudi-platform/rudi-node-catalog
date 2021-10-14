/* eslint-disable no-console */
'use strict'

const mod = 'utils'

// -----------------------------------------------------------------------------
// External dependancies
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// Internal dependancies
// -----------------------------------------------------------------------------
const { accessProperty } = require('./jsonAccess')

// -----------------------------------------------------------------------------
// Crypto
// -----------------------------------------------------------------------------

exports.extractJwt = (req) => {
  const fun = 'extractJwt'
  try {
    const header = accessProperty(req, 'headers')
    const auth = accessProperty(header, 'authorization')
    const token = auth.substring(7)
    return token
  } catch (err) {
    const errMsg = `${err} -> no token was found in the header`
    this.consoleErr(mod, fun, errMsg)
    throw new Error(errMsg)
  }
}
