'use strict';

//———————————————————————————————————————————————————————————————
// External dependencies
//———————————————————————————————————————————————————————————————
const winston = require('winston');
require('winston-daily-rotate-file');
require('winston-mongodb');

const fs = require('fs');

//———————————————————————————————————————————————————————————————
// Internal dependencies
//———————————————————————————————————————————————————————————————
const sys = require('../config/confSystem')

//———————————————————————————————————————————————————————————————
// Constants
//———————————————————————————————————————————————————————————————
const errorLogsFileName = 'error.log'

const logsTimestamp = 'YYYY/MM/DD HH:mm:ss'
const fileTimestamp = 'YYYY-MM-DD-HH'
const fileDatestamp = 'YYYY-MM-DD' 

//———————————————————————————————————————————————————————————————
// Creating local log dir
//———————————————————————————————————————————————————————————————
try {
  // first check if directory already exists
  if (!fs.existsSync(sys.LOG_DIR)) {
    fs.mkdirSync(sys.LOG_DIR);
    console.log("Log directory has been created.");
  } else {
    console.log("Log directory exists.");
  }
} catch (err) {
  console.log("Log directory creation failed:");
  console.log(err);
}

//———————————————————————————————————————————————————————————————
// Winston logger creation
//———————————————————————————————————————————————————————————————

// datedRotatingFile.on('rotate', function (oldFilename, newFilename) {
//   // perform an action when rotation takes place
// });
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
  debug: 'cyan'
});

const formatConsoleLogs =
  winston.format.combine(
    winston.format.json(), 
    winston.format.colorize({
      all: true
    }),
    winston.format.timestamp({
      format: `${logsTimestamp}`
    }),
    winston.format.printf(info => `${info.timestamp} .${info.level}. ${info.message}`)
  )

const formatFileLogs =
  winston.format.combine(
    winston.format.simple(),
    winston.format.timestamp({
      format: `${logsTimestamp}`
    }),
    winston.format.printf(info => `${info.timestamp} .${info.level}. ${info.message}`)
  )

exports.logger = winston.createLogger({
  level: 'debug',
  defaultMeta: {
    service: 'user-service'
  },

  transports: [
    // - Write to the console
    new(winston.transports.Console)({
      name: 'consoleLogs',
      format: formatConsoleLogs
    }),
    // - Write to the web
    // new(winston.transports.Http)({host: 'localhost', port: 3000, path: '/logs'}),
    // - Write all logs with logger level to a dated file
    new winston.transports.DailyRotateFile({
      name: 'datedLogs',
      filename: `${sys.LOG_DIR}/${sys.APP_NAME}-%DATE%.log`,
      datePattern: `${fileTimestamp}`,
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '7d',
      format: formatFileLogs
    }),
    // - Write all logs with level `error` and below to `error.log`
    new winston.transports.File({
      name: 'errorLogs',
      filename: `${sys.LOG_DIR}/${errorLogsFileName}`,
      level: 'error',
      format: formatFileLogs
    }),
    // - Write all logs with level `info` and below to `combined.log`
    new winston.transports.File({
      name: 'outlogs',
      filename: `${sys.LOG_DIR}/${sys.LOG_FILE}`,
      level: 'debug',
      maxSize: '1m',
      format: formatFileLogs
    }),
  ],
});