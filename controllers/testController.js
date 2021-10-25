'use strict'

const mod = 'devCtrl'

// ------------------------------------------------------------------------------------------------
// External dependancies
// ------------------------------------------------------------------------------------------------

// ------------------------------------------------------------------------------------------------
// Internal dependancies
// ------------------------------------------------------------------------------------------------
const log = require('../utils/logging')
const db = require('../db/dbQueries')
const { addErrorContext } = require('../utils/jsUtils')

// ------------------------------------------------------------------------------------------------
// tests
// ------------------------------------------------------------------------------------------------
exports.test = async (req, reply) => {
  const fun = 'test'
  try {
    const reqSearch = req.url.substring(req.url.indexOf('?'))
    const searchParams = new URLSearchParams(reqSearch)
    const rudiId = searchParams.get('id')
    const objectType = searchParams.get('type')
    log.d(mod, fun, rudiId)

    return await db.isReferencedInMetadata(objectType, rudiId)
  } catch (err) {
    log.e(mod, fun, err)
    addErrorContext(err, { mod: mod, fun: fun, err: err })
    throw err
  }
}
