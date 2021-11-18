'use strict'

const { ROUTE_NAME } = require('../../config/confApi')
const { REQ_MTD, REQ_URL } = require('../../utils/crypto')
const { treatError } = require('../../utils/errors')
const { getReqIpAndRedirections } = require('../../utils/jsUtils')
const log = require('../../utils/logging')

const mod = 'callCtxt'

// ------------------------------------------------------------------------------------------------
// Internal dependencies
// ------------------------------------------------------------------------------------------------

// ------------------------------------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------
// Request identification
// ------------------------------------------------------------------------------------------------
const AUTH = 'auth'

const REQ_IPS = 'reqIp'
const REQ_APP = 'clientApp'
const REQ_USR = 'userId'

const OP = 'operation'
const OP_ID = 'id'

const TYP_META = 'metadata'
const TYP_PRODUCER = 'producer'
const TYP_CONTACT = 'contact'
const TYP_REPORT = 'report'
const TYP_MEDIA = 'media'

const CALL_CONTEXT = 'call_context'

// ------------------------------------------------------------------------------------------------
// Class CallContext
// ------------------------------------------------------------------------------------------------
/**
 * This class is used to gather contextual information from the incoming request
 */
exports.CallContext = class CallContext {
  constructor() {
    this[AUTH] = {}
    this[OP] = {}
  }

  set ips(ipArray) {
    log.t(mod, 'setIps', ``)
    this[AUTH][REQ_IPS] = ipArray
  }
  get ips() {
    return this[AUTH][REQ_IPS]
  }

  setIpsFromRequest(req) {
    log.t(mod, 'setIpsFromRequest', ``)
    this.ips = getReqIpAndRedirections(req)
  }

  set clientApp(clientApp) {
    log.t(mod, 'setClientApp', ``)
    this[AUTH][REQ_APP] = clientApp
  }
  get clientApp() {
    return this[AUTH][REQ_APP]
  }

  set reqUser(userId) {
    log.t(mod, 'setUser', ``)
    this[AUTH][REQ_USR] = userId
  }
  get reqUser() {
    return this[AUTH][REQ_USR]
  }

  setAuth(ips, clientApp, userId) {
    log.t(mod, 'setAuth', ``)
    this.ips = Array.isArray(ips) ? ips : [ips]
    if (clientApp) this.clientApp = clientApp
    if (userId) this.reqUser = userId
  }

  setReqDetails(reqMethod, reqUrl, routeName) {
    log.t(mod, 'setReqDetails', ``)
    this[OP][REQ_MTD] = reqMethod
    this[OP][REQ_URL] = reqUrl
    this[OP][ROUTE_NAME] = routeName
  }

  set context(callContext) {
    log.t(mod, 'setCallContext', ``)
    const auth = callContext[AUTH]
    if (auth & auth[REQ_IPS]) this.setIps(auth[REQ_IPS])
  }

  get context() {
    log.t(mod, 'getContext', ``)
    return { [AUTH]: this[AUTH], [OP]: this[OP] }
  }

  static setAsReqContext(req, callContext) {
    const fun = 'setAsReqContext'
    log.t(mod, fun, ``)

    try {
      if (req[CALL_CONTEXT]) throw new Error('Call context already set')
      req[CALL_CONTEXT] = { [AUTH]: callContext[AUTH], [OP]: callContext[OP] }
      return req
    } catch (err) {
      throw treatError(err, { mod: mod, fun: fun })
    }
  }

  static getContextFromReq(req) {
    const fun = 'getContextFromReq'
    log.t(mod, fun, ``)

    try {
      const reqContext = req[CALL_CONTEXT]
      if (!reqContext) throw new Error(`Call context wasn't set`)
      const callContext = new CallContext()
      callContext[AUTH] = reqContext[AUTH]
      callContext[OP] = reqContext[OP]
      return callContext.context
    } catch (err) {
      throw treatError(err, { mod: mod, fun: fun })
    }
  }
}
