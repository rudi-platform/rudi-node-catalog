'use strict'

// const mod = 'logDb'
// ------------------------------------------------------------------------------------------------
// External dependancies
// ------------------------------------------------------------------------------------------------
const { Schema, model } = require('mongoose')
const datetime = require('date-and-time')
const { v4 } = require('uuid')
// const { omit } = require('lodash')

// ------------------------------------------------------------------------------------------------
// Internal dependancies
// ------------------------------------------------------------------------------------------------
const { LOG_DATE_FORMAT } = require('../../utils/jsUtils')

const { VALID_UUID, VALID_EPOCH_MS } = require('../schemaValidators')
const { DB_CREATED_AT } = require('../../db/dbFields')
const { LOG_EXP } = require('../../config/confLogs')

// ------------------------------------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------------------------------------
// const dayS = 60 * 60 * 24
// const logExpirationTime = 100 // 7 * dayS

// ------------------------------------------------------------------------------------------------
// Custom schema definition
// ------------------------------------------------------------------------------------------------
const LogEntrySchema = new Schema(
  {
    // Unique and permanent identifier for the log entry (required)
    entry_id: {
      type: String,
      default: v4,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      match: VALID_UUID,
    },

    // Epoch time of the event in ms
    time: {
      type: Number,
      default: Date.now,
      match: VALID_EPOCH_MS,
      index: true,
    },

    // Log message
    message: {
      type: String,
      required: true,
    },

    // log level
    log_level: {
      type: String,
      required: true,
    },

    // Module/file where the log is coming from
    location_module: {
      type: String,
    },

    // Function where the log is coming from
    location_function: {
      type: String,
    },

    user_address: {
      type: String,
    },
  },
  {
    // Adds mongoose fields 'updatedAt' and 'createdAt'
    timestamps: true,
    id: false,

    // optimisticConcurrency: true,
    // strict: true,
    // runSettersOnQuery: true,
    toObject: {
      // getters: true,
      // setters: true,
      virtuals: true,
    },
    toJSON: {
      virtuals: true,
    },
  }
)

LogEntrySchema.index({ updatedAt: 1 }, { expires: LOG_EXP })

// LogEntrySchema.virtual('time').get(() => this.createdAt.getTime())

// ------------------------------------------------------------------------------------------------
// Schema refinements
// ------------------------------------------------------------------------------------------------

// ----- toJSON cleanup
LogEntrySchema.methods.toJSON = function () {
  return logLineToString(this)

  // return omit(this.toObject(), [DB_ID, DB_V, DB_UPDATED_AT])
}

LogEntrySchema.methods.toString = function () {
  return logLineToString(this)
}

// ------------------------------------------------------------------------------------------------
// Helper function
// ------------------------------------------------------------------------------------------------
function makeLogInfo(logLvl, mod, fun, msg) {
  if (!msg) msg = ''
  return {
    message: msg, // .replace(/\"/g, "'"),
    log_level: logLvl,
    location_module: mod,
    location_function: fun,
  }
}

function logLineToString(logLine) {
  // const fun = 'logLineToString'
  // log.d(mod, fun , `logLine: ${beautify(logLine)}`)
  // const dateStr = `${format(logLine[DB_CREATED_AT], LOG_DATE_FORMAT)} ${logLine[
  //   DB_CREATED_AT
  // ].getTime()}`
  return (
    `${datetime.format(logLine[DB_CREATED_AT], LOG_DATE_FORMAT)} ${logLine.time} ${
      logLine.log_level
    } ` + `[ ${logLine.location_module} . ${logLine.location_function} ] ${logLine.message}`
  )
}

// ------------------------------------------------------------------------------------------------
// Exports
// ------------------------------------------------------------------------------------------------
const LogEntry = model('LogEntry', LogEntrySchema)

LogEntry.collection.dropIndex({ updatedAt: 1 }).catch(() => 'nevermind')
//log.d(mod, 'LogEntry.dropIndex', err + ' (nevermind)'))

module.exports = { LogEntry, makeLogInfo, logLineToString }
