'use strict'

const mod = 'devCtrl'

// ------------------------------------------------------------------------------------------------
// Internal dependencies
// ------------------------------------------------------------------------------------------------
const log = require('../utils/logging')
const db = require('../db/dbQueries')
const RudiError = require('../utils/errors')

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
    throw RudiError.treatError(mod, fun, err)
  }
}
