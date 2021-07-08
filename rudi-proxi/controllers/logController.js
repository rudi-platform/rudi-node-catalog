'use strict'

const mod = 'logCtrl'
// -----------------------------------------------------------------------------
// External dependencies
// -----------------------------------------------------------------------------
const readLastLines = require('read-last-lines')
const { boomify } = require('@hapi/boom')

// -----------------------------------------------------------------------------
// Internal dependencies
// -----------------------------------------------------------------------------
const sys = require('../config/confSystem')
const log = require('../utils/logging')
const { consoleLog, consoleErr, beautify } = require('../utils/jsUtils')

const { getLogEntries } = require('../db/dbQueries')
const { logLineToString } = require('../definitions/models/LogEntry')

const { URL_PV_LOGS_ACCESS, PARAM_LOGS_LINES, QUERY_LIMIT } = require('../config/confApi')

// -----------------------------------------------------------------------------
// Logs API access
// -----------------------------------------------------------------------------
const NB_LOG_LINES_DEFAULT = 100
const LOG_FILE = `${sys.LOG_DIR}/${sys.SYMLINK_NAME}`

exports.getLogs = async (req, reply) => {
  const fun = 'getLogs'
  try {
    log.d(mod, fun, `GET ${URL_PV_LOGS_ACCESS}`)
    /*
    const readOptions = {
      encoding: 'utf8',
      flag: 'r'
    }
    const logs = fs.readFileSync(sys.OUT_LOG, readOptions)
    */
    const nbLines = parseInt(req.query[PARAM_LOGS_LINES] || req.query[QUERY_LIMIT] || NB_LOG_LINES_DEFAULT)
    const logLines = await getLogEntries(nbLines)
    return logLines.map((logLine) => logLineToString(logLine))
  } catch (err) {
    consoleErr(mod, fun, err)
    throw boomify(err)
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
    throw boomify(err)
  }
}
