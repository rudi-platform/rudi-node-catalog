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
exports.APP_NAME = 'rudiProxi'
exports.LOG_DIR = 'logs'
exports.LOG_PATH = `./${this.LOG_DIR}`

const errorLogsFileName = 'error.log'
exports.OUT_LOGFILE = 'rudiProxi.log'

const logsTimestamp = 'YYYY/MM/DD HH:mm:ss'
const fileTimestamp = 'YYYY-MM-DD-HH'
const fileDatestamp = 'YYYY-MM-DD'

//———————————————————————————————————————————————————————————————
// Creating local log dir
//———————————————————————————————————————————————————————————————
try {
  // first check if directory already exists
  if (!fs.existsSync(this.LOG_PATH)) {
    fs.mkdirSync(this.LOG_PATH);
    console.log("Log directory has been created.");
  } else {
    console.log("Log directory exists.");
  }
} catch (err) {
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

exports.logger = winston.createLogger({
  level: 'debug',
  defaultMeta: {
    service: 'user-service'
  },
  format: winston.format.combine(
    winston.format.json(),
    winston.format.colorize({
      all: true
    }),
    winston.format.timestamp({
      format: `${logsTimestamp}`
    }),
    winston.format.printf(info => `${info.timestamp} .${info.level}. ${info.message}`)
  ),
  transports: [
    // - Write to the console
    new(winston.transports.Console)(),
    // - Write to the web
    // new(winston.transports.Http)({host: 'localhost', port: 3000, path: '/logs'}),
    // - Write all logs with logger level to a dated file
    new winston.transports.DailyRotateFile({
      filename: `${this.LOG_PATH}/${this.APP_NAME}-%DATE%.log`,
      datePattern: `${fileTimestamp}`,
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '7d'
    }),
    // - Write all logs with level `error` and below to `error.log`
    new winston.transports.File({
      filename: `${this.LOG_PATH}/${errorLogsFileName}`,
      level: 'error'
    }),
    // - Write all logs with level `info` and below to `combined.log`
    new winston.transports.File({
      filename: `${this.LOG_PATH}/${this.MAIN}`,
      level: 'debug',
      maxSize: '10m',
    }),
  ],
});
