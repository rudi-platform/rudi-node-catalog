'use strict'

const mod = 'devCtrl'

// ---------------------------------------------------------------
// External dependancies
// ---------------------------------------------------------------
const db = require("../db/dbQueries")
const url = require('url')

// ---------------------------------------------------------------
// Internal dependancies
// ---------------------------------------------------------------
const Organization = require("../definitions/models/Organization")
const json = require("../utils/jsonAccess")
const log = require("../utils/logging")
const {
  URL_OBJECT_ORGANIZATIONS,
  URL_OBJECT_CONTACTS,
  URL_OBJECT_MEDIA
} = require("../config/confApi")
const boom = require("@hapi/boom")

// ---------------------------------------------------------------
// tests
// ---------------------------------------------------------------
exports.test = async (req, reply) => {
  const fun = 'test'
  try {
    const queryParameters = url.parse(req.url, true).query
    const rudiId = queryParameters['id']
    const objectType = queryParameters['type']
    log.d(mod, fun, rudiId)

    return await db.isReferencedInMetadata(objectType, rudiId)
  } catch (err) {
    log.e(mod, fun, err)
    throw boom.boomify(err)
  }
}