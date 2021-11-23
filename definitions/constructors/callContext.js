'use strict'

const {
  ROUTE_NAME,
  PARAM_OBJECT_METADATA,
  PARAM_OBJECT_ORGANIZATIONS,
  PARAM_OBJECT_CONTACTS,
  PARAM_OBJECT_MEDIA,
  PARAM_ACTION_REPORT,
} = require('../../config/confApi')
const { REQ_MTD, REQ_URL } = require('../../utils/crypto')
const { RudiError } = require('../../utils/errors')
const { isNotEmptyArray, beautify } = require('../../utils/jsUtils')
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
const CALL_CONTEXT = 'callContext'

const AUTH = 'auth'
const REQ_IPS = 'reqIp'
const REQ_APP = 'clientApp'
const REQ_USR = 'userId'

const OP = 'operation'
const OP_TYPE = 'opType'
const STATUS_CODE = 'statusCode'

const DETAILS = 'raw'
const ERROR = 'error'
const OP_ID = 'id'

// ------------------------------------------------------------------------------------------------
// Class CallContext
// ------------------------------------------------------------------------------------------------
/**
 * This class is used to gather contextual information from the incoming request
 */
exports.CallContext = class CallContext {
  constructor(authDetails, opDetails, rawDetails) {
    const fun = 'CallContext()'
    log.d(mod, fun, `${beautify(authDetails)}, ${beautify(opDetails)}, ${beautify(rawDetails)}`)
    this[AUTH] = !authDetails ? {} : authDetails
    this[OP] = !opDetails ? {} : opDetails
    this[DETAILS] = !rawDetails ? {} : rawDetails
  }

  // ------------------------------------------------------------------------------------------------
  // Field access
  // ------------------------------------------------------------------------------------------------

  set ips(ipArray) {
    log.t(mod, 'setIps', ``)
    this[AUTH][REQ_IPS] = ipArray
  }
  get ips() {
    return this[AUTH][REQ_IPS]
  }

  setIpsFromRequest(req) {
    log.t(mod, 'setIpsFromRequest', ``)
    this.ips = CallContext.extractIpAndRedirections(req)
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

  addObjId(type, id) {
    if (!this[OP][OP_ID]) this[OP][OP_ID] = []

    this[OP][OP_ID].push(`${type}:${id}`)
  }

  addMetaId = (id) => this.addObjId(`${PARAM_OBJECT_METADATA}:${id}`)
  addProducerId = (id) => this.addObjId(`${PARAM_OBJECT_ORGANIZATIONS}:${id}`)
  addContactId = (id) => this.addObjId(`${PARAM_OBJECT_CONTACTS}:${id}`)
  addMediaId = (id) => this.addObjId(`${PARAM_OBJECT_MEDIA}:${id}`)
  addReportId = (id) => this.addObjId(`${PARAM_ACTION_REPORT}:${id}`)

  setReqDetails(reqMethod, reqUrl, routeName) {
    log.t(mod, 'setReqDetails', ``)
    this[DETAILS][REQ_MTD] = reqMethod
    this[DETAILS][REQ_URL] = reqUrl
    this[OP][OP_TYPE] = routeName
  }

  addDetails = (key, val) => (this[DETAILS][key] = val)
  getDetails = () => this[DETAILS]

  addError = (error) => (this[DETAILS][ERROR] = error)

  set statusCode(code) {
    this[OP][STATUS_CODE] = code
  }
  get statusCode() {
    return this[OP][STATUS_CODE]
  }

  get context() {
    log.t(mod, 'getContext', ``)
    return { [AUTH]: this[AUTH], [OP]: this[OP], [DETAILS]: this[DETAILS] }
  }

  // ------------------------------------------------------------------------------------------------
  // Setting to and extracting from request our custom context
  // ------------------------------------------------------------------------------------------------

  /**
   * Fetch the custom context and returns it as a CallContext object
   * @param {object} req The incoming request
   * @returns The attached custom context object
   */
  static getCallContextFromReq(req) {
    const fun = 'getCallContextFromReq'
    log.t(mod, fun, ``)
    try {
      const reqContext = CallContext.getReqContext(req)
      if (!reqContext) return undefined

      const callContext = new CallContext(reqContext[AUTH], reqContext[OP], reqContext[DETAILS])
      // log.v(mod, fun, `${beautify(callContext)}`)

      return callContext
    } catch (err) {
      throw RudiError.treatError(mod, fun, err)
    }
  }

  /**
   * Attach to the request the information of the custom context (e.g. caller auth details)
   * @param {object} req The incoming request, mutable through this operation
   * @param {*} callContext The context object the info of which we will attach to the request
   * @returns The mutated request
   */
  static setAsReqContext(req, callContext) {
    const fun = 'setAsReqContext'
    log.t(mod, fun, ``)

    try {
      if (req[CALL_CONTEXT]) throw new Error('Call context already set')
      req[CALL_CONTEXT] = callContext
      // {[AUTH]: callContext[AUTH],[OP]: callContext[OP],[DETAILS]: callContext[DETAILS],}
      return req
    } catch (err) {
      throw RudiError.treatError(mod, fun, err)
    }
  }

  /**
   * Fetch the custom context and returns it as a JS object
   * @param {object} req The incoming request
   * @returns The attached custom context object
   */
  static getReqContext(req) {
    const fun = 'getReqContext'
    log.t(mod, fun, ``)

    try {
      const context = req[CALL_CONTEXT]
      if (!context) return undefined
      return context
      // { [AUTH]: context[AUTH], [OP]: context[OP], [DETAILS]: context[DETAILS] }
    } catch (err) {
      throw RudiError.treatError(mod, fun, err)
    }
  }

  // ------------------------------------------------------------------------------------------------
  // IP Redirections display
  // ------------------------------------------------------------------------------------------------

  static extractIpRedirections(req) {
    const headers = req.headers
    return headers['x-forwarded-for'] || headers['X-Forwarded-For']
  }

  static extractIpAndRedirections(req) {
    const ip = req.ip
    const redirections = CallContext.extractIpRedirections(req)
    return redirections && isNotEmptyArray(redirections) ? [ip, ...redirections] : [ip]
  }

  static createIpRedirectionsMsg(req) {
    const headers = req.headers
    if (!headers) return ''
    const redirections = CallContext.extractIpRedirections(req)
    return redirections ? ` <- ${redirections.join(' <- ')} ` : ''
  }

  static createIpsMsg(req) {
    const ip = req.ip
    return `${ip}${CallContext.createIpRedirectionsMsg(req)}`
  }

  static createApiCallMsg(req) {
    const fun = 'createApiCallMsg'
    log.t(mod, fun, ``)
    try {
      const context = CallContext.getCallContextFromReq(req)
      if (!context) {
        log.t(mod, fun, 'No context set yet')
        return (
          `${req.method} ${req.url} (${req.context.config[ROUTE_NAME]})` +
          ` <- ${CallContext.createIpsMsg(req)}`
        )
      } else {
        log.t(mod, fun, 'A context was found')
        return (
          `${req.method} ${req.url} (${req.context.config[ROUTE_NAME]})` +
          ` <- ${context.clientApp ? `${context.clientApp}` : ''}${
            context.reqUser ? ` | ${context.reqUser}` : ''
          }${context.clientApp || context.reqUser ? ' @ ' : ''}${CallContext.createIpsMsg(req)}`
        )
      }
    } catch (err) {
      throw RudiError.treatError(mod, fun, err)
    }
  }
}
