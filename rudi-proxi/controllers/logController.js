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
const {
  LOG_DIR,
  OUT_LOGFILE
} = require('../config/confLogs');

//———————————————————————————————————————————————————————————————
// Internal dependancies 
//———————————————————————————————————————————————————————————————
const log = require('../utils/logging')
const msg = require('../utils/msg')

exports.getLogs = () => {
  const fun = 'getLogs'
  log.d(mod, fun, ``)

  // let stream = fs.createReadStream(`${LOG_DIR}/${OUT_LOGFILE}`);
  return 'to be implemented'
}

exports.getAppId = () => {
  const fun = 'getAppId'
  const hashId = require('child_process').execSync('git rev-parse --short HEAD')
  log.d(mod, fun, `${hashId}`)

  return hashId
}