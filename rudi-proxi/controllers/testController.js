'use strict'

const mod = 'devCtrl'

// -----------------------------------------------------------------------------
// External dependancies
// -----------------------------------------------------------------------------
const db = require('../db/dbQueries')

// -----------------------------------------------------------------------------
// Internal dependancies
// -----------------------------------------------------------------------------
const log = require('../utils/logging')
const boom = require('@hapi/boom')

// -----------------------------------------------------------------------------
// tests
// -----------------------------------------------------------------------------
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
    throw boom.boomify(err)
  }
}
