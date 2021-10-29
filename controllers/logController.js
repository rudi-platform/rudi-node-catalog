'use strict'

const mod = 'logCtrl'
// ------------------------------------------------------------------------------------------------
// External dependencies
// ------------------------------------------------------------------------------------------------
const readLastLines = require('read-last-lines')

// ------------------------------------------------------------------------------------------------
// Internal dependencies
// ------------------------------------------------------------------------------------------------
const sys = require('../config/confSystem')
const log = require('../utils/logging')
const { consoleErr } = require('../utils/jsUtils')

const { getLogEntries } = require('../db/dbQueries')
const { parseQueryParameters } = require('./genericController')

const {
  URL_PV_LOGS_ACCESS,
  PARAM_LOGS_LINES,
  QUERY_LIMIT,
  QUERY_OFFSET,
  PARAM_OBJECT_LOGS,
  QUERY_FILTER,
  QUERY_FIELDS,
} = require('../config/confApi')
const { pick } = require('lodash')
const { treatError } = require('../utils/errors')

// ------------------------------------------------------------------------------------------------
// Logs API access
// ------------------------------------------------------------------------------------------------
const NB_LOG_LINES_DEFAULT = 100
const LOG_FILE = `${sys.LOG_DIR}/${sys.SYMLINK_NAME}`

// obsolete
exports.getLogs = async (req, reply) => {
  const fun = 'getLogs'
  try {
    log.d(mod, fun, `GET ${URL_PV_LOGS_ACCESS}`)
    let parsedParameters
    try {
      parsedParameters = await parseQueryParameters(PARAM_OBJECT_LOGS, req.url)
    } catch (err) {
      log.w(mod, fun, err)
      return []
    }
    const options = pick(parsedParameters, [QUERY_LIMIT, QUERY_OFFSET, QUERY_FILTER, QUERY_FIELDS])

    const logLines = await getLogEntries(options)
    return logLines //.map((logLine) => logLineToString(logLine))
  } catch (err) {
    consoleErr(mod, fun, err)
    throw treatError(err, { mod: mod, fun: fun })
  }
}

exports.getLastLogLines = async (req, reply) => {
  const fun = 'getLastLogLines'
  try {
    log.d(mod, fun, `GET ${URL_PV_LOGS_ACCESS}/:${PARAM_LOGS_LINES}`)

    const nbLines = req.params[PARAM_LOGS_LINES] || req.params[QUERY_LIMIT] || NB_LOG_LINES_DEFAULT
    const logs = readLastLines.read(LOG_FILE, nbLines)
    return logs
  } catch (err) {
    log.e(mod, fun, err)
    throw treatError(err, { mod: mod, fun: fun })
  }
}
