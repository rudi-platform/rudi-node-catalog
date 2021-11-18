'use strict'

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

  get context() {
    log.t(mod, 'getContext', ``)
    return { [AUTH]: this[AUTH], [OP]: this[OP] }
  }

  setIps(ipArray) {
    log.t(mod, 'setIps', ``)
    this[AUTH][REQ_IPS] = ipArray
  }
  setIpsFromRequest(req) {
    log.t(mod, 'setIpsFromRequest', ``)
    this.setIps(getReqIpAndRedirections(req))
  }
  setClientApp(clientApp) {
    log.t(mod, 'setClientApp', ``)
    this[AUTH][REQ_APP] = clientApp
  }
  setUser(userId) {
    log.t(mod, 'setUser', ``)
    this[AUTH][REQ_USR] = userId
  }
  setAuth(ips, clientApp, userId) {
    log.t(mod, 'setAuth', ``)
    this.setIps(Array.isArray(ips) ? ips : [ips])
    if (clientApp) this.setClientApp(clientApp)
    if (userId) this.setUser(userId)
  }

  setCallContext(callContext) {
    log.t(mod, 'setCallContext', ``)
    const auth = callContext[AUTH]
    if (auth & auth[REQ_IPS]) this.setIps(auth[REQ_IPS])
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
