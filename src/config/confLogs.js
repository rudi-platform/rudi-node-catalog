const mod = 'logConf'
const fun = 'init'

// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import { existsSync, mkdirSync } from 'fs'

import rudiLogger, { Facility, Transport } from '@aqmo.org/rudi_logger'
import winston from 'winston'
import 'winston-daily-rotate-file'

const { combine, timestamp, printf, colorize, simple } = winston.format
const syslogLevels = {
  fatal: 0,
  warn: 4,
  trace: 7,
  ...winston.config.syslog.levels,
}
// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { resolve } from 'path'
import { LOG_DATE_FORMAT, consoleErr, consoleLog, separateLogs } from '../utils/jsUtils.js'
import { getConf } from './appOptions.js'
import {
  getAppName,
  getGitHash,
  getNodeEnv,
  shouldControlPrivateRequests,
  shouldControlPublicRequests,
} from './confSystem.js'

separateLogs('Loading log conf', true) ///////////////////////////////////////////////////////////

// -------------------------------------------------------------------------------------------------
// Reading conf file
// -------------------------------------------------------------------------------------------------
const APP_NAME = getAppName()

// ----- Flags section
const FLAGS_SECTION = 'flags'

export const SHOULD_LOG_CONSOLE = getConf(FLAGS_SECTION, 'should_log_console')
const SHOULD_FILELOG = getConf(FLAGS_SECTION, 'should_log_in_file')
const SHOULD_SHOW_ERROR_PILE = getConf(FLAGS_SECTION, 'should_show_error_pile')
const SHOULD_SHOW_ROUTES = getConf(FLAGS_SECTION, 'should_show_routes')
export const SHOULD_SYSLOG = getConf(FLAGS_SECTION, 'should_syslog')
const SHOULD_SYSLOG_IN_CONSOLE = getConf(FLAGS_SECTION, 'should_syslog_in_console')
const SHOULD_SYSLOG_IN_FILE = getConf(FLAGS_SECTION, 'should_syslog_in_file')

export const shouldShowErrorPile = () => SHOULD_SHOW_ERROR_PILE
export const shouldShowRoutes = () => SHOULD_SHOW_ROUTES

// Log feedback
const checkOption = (msg, flag) => consoleLog(mod, fun, `[${flag ? 'x' : ' '}] ${msg}`)
checkOption('Should log on console', SHOULD_LOG_CONSOLE)
checkOption('Control private requests', shouldControlPrivateRequests())
checkOption('Control public requests', shouldControlPublicRequests())
checkOption('Log in file', SHOULD_FILELOG)
checkOption('Show error pile', SHOULD_SHOW_ERROR_PILE)
checkOption('Sent syslogs', SHOULD_SYSLOG)
checkOption('Backup syslogs in file', SHOULD_SYSLOG_IN_FILE)
checkOption('Should log routes', SHOULD_SHOW_ROUTES)

// ----- Logs section
const LOG_SECTION = 'logging'

const LOG_LVL = getConf(LOG_SECTION, 'log_level', 'debug')
consoleLog(mod, fun, `Log level set to '${LOG_LVL.toUpperCase()}'`)

const LOG_DIR = getConf(LOG_SECTION, 'log_dir')
const LOG_FILE = getConf(LOG_SECTION, 'log_file')

export const LOG_EXP = getConf(LOG_SECTION, 'expires', '7d')
export const getLogLevel = () => LOG_LVL

// ----- Syslog
const SYSLOG_SECTION = 'syslog'

const SYSLOG_LVL = getConf(SYSLOG_SECTION, 'log_level', 'info')
// const SYSLOG_NODE_NAME = getConf(SYSLOG_SECTION, 'syslog_node_name')
export const SYSLOG_PROTOCOL = getConf(SYSLOG_SECTION, 'syslog_protocol', 'unix')

const getFacilityConf = () => {
  const facilityConf = getConf(SYSLOG_SECTION, 'syslog_facility')
  let facility = 'none'
  if (facilityConf.slice(0, 5) === 'local') {
    const localNb = Number(facilityConf.slice(5, 1))
    if (0 <= localNb && localNb <= 7) {
      facility = Facility.Local0 + localNb
    }
  } else {
    const facilityNb = Number(facilityConf)
    if (!isNaN(facilityNb) && 0 <= facilityNb && facilityNb <= 23) {
      facility = facilityNb
    }
  }
  if (facility == 'none')
    throw new Error(
      `Incorrect value for parameter syslog.syslog_facility. Should be a number between 0 and 23 or a string from "local0" to "local7", got: ${SYSLOG_FACILITY}`
    )
  return facility
}

const SYSLOG_FACILITY = getFacilityConf()
const SYSLOG_HOST = getConf(SYSLOG_SECTION, 'syslog_host')
const SYSLOG_PORT = getConf(SYSLOG_SECTION, 'syslog_port', 514) // default: 514
// const SYSLOG_TYPE = getConf(SYSLOG_SECTION, 'syslog_type', 'RFC5424') // bsd | 5424
const SYSLOG_SOCKET = getConf(SYSLOG_SECTION, 'syslog_socket') // the socket for sending syslog diagrams
const SYSLOG_DIR = `${getConf(SYSLOG_SECTION, 'syslog_dir')}/` // path of the syslog backup file

// -------------------------------------------------------------------------------------------------
// Creating local log dir
// -------------------------------------------------------------------------------------------------
if (SHOULD_FILELOG) {
  try {
    // first check if directory already exists
    if (!existsSync(LOG_DIR)) {
      mkdirSync(LOG_DIR, { recursive: true })
      consoleLog(mod, fun, `Log directory created: '${LOG_DIR}'`)
    } else {
      consoleLog(mod, fun, `Log directory: '${LOG_DIR}'`)
    }
  } catch (err) {
    consoleErr(mod, fun, `Log directory creation failed: ${err}`)
    throw err
  }
}

if (SHOULD_SYSLOG_IN_FILE) {
  try {
    // first check if directory already exists
    if (!existsSync(SYSLOG_DIR)) {
      mkdirSync(SYSLOG_DIR, { recursive: true })
      consoleLog(mod, fun, `Syslog directory created: '${SYSLOG_DIR}'`)
    } else {
      consoleLog(mod, fun, `Syslog directory: '${SYSLOG_DIR}'`)
    }
  } catch (err) {
    consoleErr(mod, fun, `Log directory creation failed: ${err}`)
    throw err
  }
}

// -------------------------------------------------------------------------------------------------
// Winston logger creation : LOG FILE
// -------------------------------------------------------------------------------------------------

winston.addColors({
  error: 'bold red',
  warn: 'italic magenta',
  info: 'italic yellow',
  verbose: 'green',
  debug: 'cyan',
})

const FORMAT_TIMESTAMP = { format: LOG_DATE_FORMAT }
const LOGS_FORMAT_PRINTF = (info) =>
  `${info.level}`.slice(0, 1).toUpperCase() + ` ${info.timestamp} ${info.message}`

const formatConsoleLogs = combine(
  timestamp(FORMAT_TIMESTAMP),
  printf(LOGS_FORMAT_PRINTF),
  colorize({ all: true })
)
const formatFileLogs = combine(simple(), timestamp(FORMAT_TIMESTAMP), printf(LOGS_FORMAT_PRINTF))

const MAX_SIZE = 50 * 1024 * 1024

// Loggers configuration
const logOutputs = {
  // - Write to the console
  console: new winston.transports.Console({
    name: 'consoleLogs',
    level: LOG_LVL === 'trace' ? 'debug' : LOG_LVL,
    levels: syslogLevels,
    format: formatConsoleLogs,
  }),

  // To log errors caught on fastify level (obsolete)
  ffError: new winston.transports.File({
    name: 'ffLogs',
    filename: `${LOG_DIR}/ff-errors.log`,
    level: 'warn',
    maxsize: MAX_SIZE,
    maxFiles: 2,
    format: formatFileLogs,
  }),
}

// Console/file logger creation
const loggerOpts = {
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
      symlinkName: `${APP_NAME}-current.log`,
      maxSize: '75m',
      maxFiles: '7d',
      extension: '.log',
      format: formatFileLogs,
      level: LOG_LVL,
    })
  )

  // - Write all logs with level `debug`
  loggerOpts.transports.push(
    new winston.transports.File({
      name: 'combinedLogs',
      filename: `${LOG_DIR}/${LOG_FILE}`,
      maxsize: MAX_SIZE,
      maxFiles: 5,
      zippedArchive: false, // zip doesn't work unfortunately
      format: formatFileLogs,
    })
  )

  // // - Write all logs with level `error` and below to `error.log`
  // loggerOpts.transports.push(
  //   new winston.transports.File({
  //     name: 'errorLogs',
  //     filename: `${logDir()}/${errorLogsFileName}`,
  //     level: 'error',
  //     maxsize: MAX_SIZE,
  //     maxFiles: 2,
  //     format: formatFileLogs,
  //   })
  // )
}

export const wConsoleLogger = winston.createLogger(loggerOpts)

// -------------------------------------------------------------------------------------------------
// Winston logger creation : logger for errors caught only on Fastify level (should be obsolete)
// -------------------------------------------------------------------------------------------------
const FF_LOGGER = 'ffLogger'
export const initFFLogger = () => {
  const fun = 'initFFLogger'
  // Here we use winston.containers IoC
  winston.loggers.add(FF_LOGGER, {
    level: 'warn',
    // Adding ISO levels of logging from PINO
    levels: syslogLevels,
    // format: format.combine(format.splat(), format.json()),
    defaultMeta: {
      service: getAppName() + '_' + getNodeEnv(),
    },
    transports: [logOutputs.ffError],
  })

  // Here we use winston.containers IoC get accessor
  const ffLogger = winston.loggers.get(FF_LOGGER)

  process.on('uncaughtException', (err) => {
    consoleErr(mod, fun, `UncaughtException processing: ${err}`)
  })

  // PINO like, we link winston.containers to use only one instance of logger
  ffLogger.child = () => winston.loggers.get(FF_LOGGER)

  return ffLogger
}

// export const sysLogger = winston.createLogger(syslogOpts)
function getRudiLoggerOptions() {
  let transport
  let path = SYSLOG_HOST
  switch (SYSLOG_PROTOCOL) {
    case 'tcp':
      transport = Transport.Tcp
      break
    case 'udp':
      transport = Transport.Udp
      break
    case 'unix':
      transport = Transport.Unix
      path = SYSLOG_SOCKET
      break
    default:
      transport = Transport.Udp
  }
  const rudiLoggerOpts = {
    log_server: { path, port: SYSLOG_PORT, facility: SYSLOG_FACILITY, transport },
    log_local: {
      directory: resolve(SYSLOG_DIR),
      prefix: 'rudiProdApi',
      console: !!SHOULD_SYSLOG_IN_CONSOLE,
      consoleData: !!SHOULD_SYSLOG_IN_CONSOLE,
      level: SYSLOG_LVL,
    },
  }

  return rudiLoggerOpts
}

export const sysLogger = new rudiLogger.RudiLogger(
  getAppName(),
  getGitHash(),
  getRudiLoggerOptions()
)
