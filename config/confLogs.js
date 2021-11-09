'use strict'

const mod = 'logger'

// ------------------------------------------------------------------------------------------------
// External dependencies
// ------------------------------------------------------------------------------------------------
const { existsSync, mkdirSync } = require('fs')

const winston = require('winston')
require('winston-daily-rotate-file')
require('winston-syslog').Syslog

// ------------------------------------------------------------------------------------------------
// Internal dependencies
// ------------------------------------------------------------------------------------------------
const utils = require('../utils/jsUtils')
const sys = require('../config/confSystem')

// ------------------------------------------------------------------------------------------------
// Reading conf file
// ------------------------------------------------------------------------------------------------
const APP_NAME = sys.getAppName()

// ----- Flags section
const FLAGS_SECTION = 'flags'

const SHOULD_FILELOG = sys.getIniValue(FLAGS_SECTION, 'should_log_in_file', false)
const SHOULD_SHOW_ERROR_PILE = sys.getIniValue(FLAGS_SECTION, 'should_show_error_pile', false) // TODO || true
const SHOULD_SYSLOG = sys.getIniValue(FLAGS_SECTION, 'should_syslog')
const SHOULD_SYSLOG_IN_FILE = sys.getIniValue(FLAGS_SECTION, 'should_syslog_in_file')

exports.shouldShowErrorPile = () => SHOULD_SHOW_ERROR_PILE
utils.consoleLog(
  mod,
  '',
  `[${sys.shouldControlPrivateRequests() ? 'x' : ' '}] Controle private requests`
)
utils.consoleLog(
  mod,
  '',
  `[${sys.shouldControlPublicRequests() ? 'x' : ' '}] Controle public requests`
)
utils.consoleLog(mod, '', `[${SHOULD_FILELOG ? 'x' : ' '}] Logging in file`)
utils.consoleLog(mod, '', `[${SHOULD_SHOW_ERROR_PILE ? 'x' : ' '}] Show error pile`)
utils.consoleLog(mod, '', `[${SHOULD_SYSLOG ? 'x' : ' '}] Logs sent to syslog`)
utils.consoleLog(mod, '', `[${SHOULD_SYSLOG_IN_FILE ? 'x' : ' '}] Syslogs backup in file`)

// ----- Logs section
const LOG_SECTION = 'logging'

const LOG_LVL = sys.getIniValue(LOG_SECTION, 'log_level', 'debug')
utils.consoleLog(mod, '', `Log level set to '${LOG_LVL}'`)
exports.getLogLevel = () => LOG_LVL

const LOG_DIR = sys.getIniValue(LOG_SECTION, 'log_dir')
const LOG_FILE = sys.getIniValue(LOG_SECTION, 'log_file')

// const SYMLINK_NAME = `${APP_NAME}-current.log`

exports.LOG_EXP = sys.getIniValue(LOG_SECTION, 'expires', '7d')

// ----- Syslog
const SYSLOG_SECTION = 'syslog'

const SYSLOG_NODE_NAME = sys.getIniValue(SYSLOG_SECTION, 'syslog_node_name')
const SYSLOG_PROTOCOL = sys.getIniValue(SYSLOG_SECTION, 'syslog_protocol')
const SYSLOG_FACILITY = sys.getIniValue(SYSLOG_SECTION, 'syslog_facility')
const SYSLOG_HOST = sys.getIniValue(SYSLOG_SECTION, 'syslog_host')
const SYSLOG_PORT = sys.getIniValue(SYSLOG_SECTION, 'syslog_port', 514) // default: 514
const SYSLOG_TYPE = sys.getIniValue(SYSLOG_SECTION, 'syslog_type', 'RFC5424') // bsd | 5424
const SYSLOG_SOCKET = sys.getIniValue(SYSLOG_SECTION, 'syslog_socket') // the socket for sending syslog diagrams
const SYSLOG_DIR = sys.getIniValue(SYSLOG_SECTION, 'syslog_dir') // path of the syslog backup file
const SYSLOG_FILE = sys.getIniValue(SYSLOG_SECTION, 'syslog_file') // redundancy to backup syslog, in case something is wrong with the 'path' solution

// ------------------------------------------------------------------------------------------------
// Creating local log dir
// ------------------------------------------------------------------------------------------------
if (SHOULD_FILELOG) {
  try {
    // first check if directory already exists
    if (!existsSync(LOG_DIR)) {
      mkdirSync(LOG_DIR, { recursive: true })
      utils.consoleLog(mod, '', 'Log directory has been created.')
    } else {
      utils.consoleLog(mod, '', 'Log directory exists.')
    }
  } catch (err) {
    utils.consoleErr(mod, '', `Log directory creation failed: ${err}`)
    throw err
  }
}

if (SHOULD_SYSLOG_IN_FILE) {
  try {
    // first check if directory already exists
    if (!existsSync(SYSLOG_DIR)) {
      mkdirSync(SYSLOG_DIR, { recursive: true })
      utils.consoleLog(mod, '', 'Syslog directory has been created.')
    } else {
      utils.consoleLog(mod, '', 'Syslog directory exists.')
    }
  } catch (err) {
    utils.consoleErr(mod, '', `Log directory creation failed: ${err}`)
    throw err
  }
}

// ------------------------------------------------------------------------------------------------
// Winston logger creation : LOG FILE
// ------------------------------------------------------------------------------------------------

// datedRotatingFile.on('rotate', function (oldFilename, newFilename) {
//   // perform an action when rotation takes place
// })
/*
// - New transport : MongoDB
const options ={
  db: `${sys.DB_LOGS_URL}`,
  collection: 'logs'
}
const transportMongoDb = new winston.transports.MongoDB(options)
 */
winston.addColors({
  error: 'bold red',
  warn: 'italic magenta',
  info: 'italic yellow',
  verbose: 'green',
  debug: 'cyan',
})

const FORMAT_TIMESTAMP = { format: utils.LOG_DATE_FORMAT }

const FORMAT_PRINTF = (info) => `${info.timestamp} .${info.level}. ${info.message}`

const formatConsoleLogs = winston.format.combine(
  winston.format.json(),
  winston.format.colorize({ all: true }),
  winston.format.timestamp(FORMAT_TIMESTAMP),
  winston.format.printf(FORMAT_PRINTF)
)

const formatFileLogs = winston.format.combine(
  winston.format.simple(),
  winston.format.timestamp(FORMAT_TIMESTAMP),
  winston.format.printf(FORMAT_PRINTF)
)

const MAX_SIZE = 50 * 1024 * 1024

// Loggers configuration
const logOutputs = {
  // - Write to the console
  console: new winston.transports.Console({
    name: 'consoleLogs',
    level: LOG_LVL,
    levels: winston.config.syslog.levels,
    format: formatConsoleLogs,
  }),

  // To log errors caught on fastify level (obsolete)
  ffError: new winston.transports.File({
    name: 'ffLogs',
    filename: `${LOG_DIR}/ff-errors.log`,
    level: 'error',
    maxsize: MAX_SIZE,
    maxFiles: 2,
    format: formatFileLogs,
  }),
}

// Console/file logger creation
const loggerOpts = {
  level: LOG_LVL,
  defaultMeta: {
    service: 'user-service',
  },

  transports: [logOutputs.console],
  // transports: [logOutputs.console, logOutputs.datedFile, logOutputs.combined],
}

if (SHOULD_FILELOG) {
  // Dated files
  loggerOpts.transports.push(
    new winston.transports.DailyRotateFile({
      name: 'datedLogs',
      dirname: LOG_DIR,
      filename: `${APP_NAME}-%DATE%`,
      datePattern: 'YYYY-MM-DD-HH',
      createSymlink: true,
      symlinkName: sys.SYMLINK_NAME,
      maxSize: '75m',
      maxFiles: '7d',
      extension: '.log',
      format: formatFileLogs,
    })
  )

  // - Write all logs with level `debug`
  loggerOpts.transports.push(
    new winston.transports.File({
      name: 'combinedlogs',
      filename: `${LOG_DIR}/${LOG_FILE}`,
      level: sys.LOG_LVL,
      maxsize: MAX_SIZE,
      maxFiles: 5,
      zippedArchive: true,
      format: formatFileLogs,
    })
  )

  // // - Write all logs with level `error` and below to `error.log`
  // loggerOpts.transports.push(
  //   new winston.transports.File({
  //     name: 'errorLogs',
  //     filename: `${this.logDir()}/${errorLogsFileName}`,
  //     level: 'error',
  //     maxsize: MAX_SIZE,
  //     maxFiles: 2,
  //     format: formatFileLogs,
  //   })
  // )
}

exports.logger = winston.createLogger(loggerOpts)

// ------------------------------------------------------------------------------------------------
// Winston logger creation : logger for errors caught only on Fastify level (should be obsolete)
// ------------------------------------------------------------------------------------------------
const FF_LOGGER = 'ffLogger'
exports.initFFLogger = () => {
  const fun = 'initFFLogger'
  // Here we use winston.containers IoC
  winston.loggers.add(FF_LOGGER, {
    level: 'warn',
    // Adding ISO levels of logging from PINO
    levels: Object.assign(
      {
        fatal: 0,
        warn: 4,
        trace: 7,
      },
      winston.config.syslog.levels
    ),
    // format: format.combine(format.splat(), format.json()),
    defaultMeta: {
      service: sys.getAppName() + '_' + (process.env.NODE_ENV || 'development'),
    },
    transports: [logOutputs.ffError],
  })

  // Here we use winston.containers IoC get accessor
  const ffLogger = winston.loggers.get(FF_LOGGER)

  process.on('uncaughtException', (err) => {
    utils.consoleErr(mod, fun, `UncaughtException processing: ${err}`)
  })

  // PINO like, we link winston.containers to use only one instance of logger
  ffLogger.child = () => winston.loggers.get(FF_LOGGER)

  return ffLogger
}

// ------------------------------------------------------------------------------------------------
// Winston logger creation : SYSLOG
// ------------------------------------------------------------------------------------------------

// const formatConsoleSysLogs = winston.format.combine(
//   // winston.format.json(),
//   // winston.format.colorize(COLORIZE_ALL),
//   // winston.format.timestamp(FORMAT_TIMESTAMP),
//   winston.format.printf(
//     (err) =>
//       `${err.level} ${utils.toISOLocale()} ${err.message} ${
//         err.meta ? utils.beautify(err.meta) : ''
//       }`
//   )
// )

const syslogOpts = {
  levels: winston.config.syslog.levels,
  level: 'debug',
  // transports: [logOutputs.console],
  transports: [],
  // transports: [syslogOuts.syslog, syslogOuts.console, syslogOuts.file],
}

if (SHOULD_SYSLOG) {
  // Push to syslog socket
  syslogOpts.transports.push(
    new winston.transports.Syslog({
      name: 'syslogSocket',
      localhost: SYSLOG_NODE_NAME,
      facility: SYSLOG_FACILITY,
      protocol: SYSLOG_PROTOCOL,
      host: SYSLOG_HOST,
      port: SYSLOG_PORT,
      path: SYSLOG_SOCKET,
      type: SYSLOG_TYPE,
      app_name: APP_NAME,
      level: 'info',
    })
  )
} else {
  syslogOpts.transports.push(logOutputs.console)
}

if (SHOULD_SYSLOG_IN_FILE) {
  // Write in a dedicated syslog file
  syslogOpts.transports.push(
    new winston.transports.File({
      name: 'syslogFile',
      filename: `${SYSLOG_DIR}/${SYSLOG_FILE}`,
      format: formatFileLogs,
      zippedArchive: false, // zip doesn't work unfortunately
      maxsize: MAX_SIZE,
      maxFiles: 5,
      level: 'info',
    })
  )
}

exports.sysLogger = winston.createLogger(syslogOpts)
