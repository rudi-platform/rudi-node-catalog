'use strict';

const mod = 'sysCtrl'
/*
 * In this file are made the different steps followed for each 
 * action on the contacts (producer or publisher)
 */

//———————————————————————————————————————————————————————————————
// External dependancies 
//———————————————————————————————————————————————————————————————
const boom = require('@hapi/boom')
const fs = require('fs');


//———————————————————————————————————————————————————————————————
// Internal dependancies 
//———————————————————————————————————————————————————————————————
const log = require('../utils/logging')
const msg = require('../utils/msg')

const {
  LOG_DIR,
  OUT_LOGFILE,
  OUT_LOG
} = require('../config/confLogs');

//———————————————————————————————————————————————————————————————
// App ID
//———————————————————————————————————————————————————————————————
exports.getAppId = () => {
  const fun = 'getAppId'
  const hashId = require('child_process').execSync('git rev-parse --short HEAD')
  log.d(mod, fun, `${hashId}`)

  return hashId
}


//———————————————————————————————————————————————————————————————
// Logs
//———————————————————————————————————————————————————————————————

exports.getLogs = () => {
  const fun = 'getLogs'
  log.d(mod, fun, ``)

  // The filename is simple the local directory and tacks on the requested url
  const filename = `./${OUT_LOG}`

  // This line opens the file as a readable stream
  const logs = fs.readFileSync(filename, {encoding:'utf8', flag:'r'});

  return logs
}
