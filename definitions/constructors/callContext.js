'use strict'

const mod = 'callCtxt'

// ------------------------------------------------------------------------------------------------
// External dependencies
// ------------------------------------------------------------------------------------------------
const { nanoid } = require('nanoid')

// ------------------------------------------------------------------------------------------------
// Internal dependencies
// ------------------------------------------------------------------------------------------------
const { isNotEmptyArray, beautify, dateEpochMsToIso } = require('../../utils/jsUtils')
const log = require('../../utils/logging')
const { RudiError } = require('../../utils/errors')

// ------------------------------------------------------------------------------------------------
// External constants
// ------------------------------------------------------------------------------------------------
const {
  ROUTE_NAME,
  PARAM_OBJECT_METADATA,
  PARAM_OBJECT_ORGANIZATIONS,
  PARAM_OBJECT_CONTACTS,
  PARAM_OBJECT_MEDIA,
  PARAM_ACTION_REPORT,
} = require('../../config/confApi')

// ------------------------------------------------------------------------------------------------
// Internal constants
// ------------------------------------------------------------------------------------------------

/**
 * This class makes it possible to add to the request received by node a context that will be
 * helpful to create syslog lines.
 * Technically, it adds a new property to the request [CALL_CONTEXT] that is structured along
 * the RudiLogger structure (see https://gitlab.aqmo.org/rudidev/rudilogger)
 * and more specifically like this:
 * {
 *    [AUTH]: {JS object} identification informations
 *    {
 *        [REQ_IPS]: {array} list of IP redirections, in inverse chronological order
 *        [REQ_APP]: {string} identifier of the app/module that sends the request
 *        [REQ_USR]: {string} identified user that launches the request
 *    },
 *    [OP]: {JS object} operations informations
 *    {
 *        [OP_TYPE]: {string} identifies the operation corresponding to the request
 *        [STATUS_CODE]: {int} HTTP status code of the reply
 *        [OP_ID]: {array} list of the objects affected by the operation in the shape "op_type:id"
 *    },
 *    [DETAILS]: {JS object} additional details (this is )
 *    {
 *        [ERROR]: {JS object} error details
 *        [TIME]: {JS object} timestamp and request duration
 *        [REQ]: {string} an identifier for this request
 *    }
 * }
 */
const CALL_CONTEXT = 'callContext'

const AUTH = 'auth'
const REQ_IPS = 'reqIp'
const REQ_APP = 'clientApp'
const REQ_USR = 'userId'

const OP = 'operation'
const OP_TYPE = 'opType'
const STATUS_CODE = 'statusCode'
const OP_ID = 'id'

const DETAILS = 'raw'
const ERROR = 'error'
const ERR_PLACE = 'errPlace'
const ERR_ON_REQ = 'errOnReq'

const REQ = 'req'
const REQ_ID = 'id'
const REQ_MTD = 'mtd'
const REQ_URL = 'url'
const REQ_TIMESTAMP = 'tsMs'
const REQ_DURATION = 'durMs'

// ------------------------------------------------------------------------------------------------
// Class CallContext
// ------------------------------------------------------------------------------------------------
/**
 * This class is used to gather contextual information from the incoming request
 */
exports.CallContext = class CallContext {
  constructor(authDetails, opDetails, rawDetails) {
    const fun = 'CallContext()'
    const msg = `${authDetails ? beautify(authDetails) : ''}, ${
      opDetails ? beautify(opDetails) : ''
    }, ${rawDetails ? beautify(rawDetails) : ''}`
    log.t(mod, fun, msg)
    this[AUTH] = !authDetails ? {} : authDetails
    this[OP] = !opDetails ? {} : opDetails
    this[DETAILS] = !rawDetails ? {} : rawDetails
    this.setId()
  }

  // ------------------------------------------------------------------------------------------------
  // Field access
  // ------------------------------------------------------------------------------------------------

  set ips(ipArray) {
    log.t(mod, 'setIps', ``)
    if (!Array.isArray(ipArray)) throw new RudiError(`Context IPs can only be set as an array`)
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
    if (!this[OP] || !this[OP][OP_ID]) this[OP][OP_ID] = []
    this[OP][OP_ID].push(`${type}:${id}`)
  }

  addMetaId = (id) => this.addObjId(`${PARAM_OBJECT_METADATA}:${id}`)
  addProducerId = (id) => this.addObjId(`${PARAM_OBJECT_ORGANIZATIONS}:${id}`)
  addContactId = (id) => this.addObjId(`${PARAM_OBJECT_CONTACTS}:${id}`)
  addMediaId = (id) => this.addObjId(`${PARAM_OBJECT_MEDIA}:${id}`)
  addReportId = (id) => this.addObjId(`${PARAM_ACTION_REPORT}:${id}`)

  setReqDescription(reqMethod, reqUrl, routeName) {
    log.t(mod, 'setReqDescription', ``)
    if (!this[DETAILS][REQ]) this[DETAILS][REQ] = {}
    this[DETAILS][REQ][REQ_MTD] = reqMethod
    this[DETAILS][REQ][REQ_URL] = reqUrl
    this[OP][OP_TYPE] = routeName
  }
  get routeName() {
    return this[OP][OP_TYPE]
  }
  get reqMethod() {
    return this[DETAILS][REQ][REQ_MTD]
  }
  get reqUrl() {
    return this[DETAILS][REQ][REQ_URL]
  }

  addDetails(key, val) {
    this[DETAILS][key] = val
  }
  getDetails = () => this[DETAILS]
  getDetailsStr = () => JSON.stringify(this[DETAILS])

  getReqDetails() {
    if (!this[DETAILS][REQ]) this[DETAILS][REQ] = {}
    return this[DETAILS][REQ]
  }

  formatReqDetails = () => {
    const reqDetails = this.getReqDetails()
    return `${dateEpochMsToIso(this.timestamp)} [${this.id}] ${this.reqMethod} ${this.reqUrl}`
  }

  get apiCallMsg() {
    const fun = 'apiCallMsg'
    log.t(mod, fun, ``)
    try {
      return (
        this.reqDetailsMsg +
        ` <- ${this.clientApp ? `${this.clientApp}` : ''}` +
        `${this.reqUser ? ` | ${this.reqUser}` : ''}${
          this.clientApp || this.reqUser ? ' @ ' : ''
        }${this.ips.join(' <- ')}`
      )
    } catch (err) {
      throw RudiError.treatError(mod, fun, err)
    }
  }

  get reqDetailsMsg() {
    const fun = 'reqDetailsMsg'
    log.t(mod, fun, ``)
    try {
      return `${this.reqMethod} ${this.reqUrl} (${this.routeName})`
    } catch (err) {
      throw RudiError.treatError(mod, fun, err)
    }
  }

  setId() {
    const reqDetails = this.getReqDetails()
    if (!reqDetails[REQ_ID]) reqDetails[REQ_ID] = nanoid(8)
  }
  get id() {
    const reqDetails = this.getReqDetails()
    if (!reqDetails[REQ_ID]) this.setId()
    return reqDetails[REQ_ID]
  }

  set timestamp(epochTimeMs) {
    const reqDetails = this.getReqDetails()
    if (!reqDetails[REQ_TIMESTAMP]) reqDetails[REQ_TIMESTAMP] = epochTimeMs
  }
  get timestamp() {
    return this.getReqDetails()[REQ_TIMESTAMP]
  }
  set duration(durationMs) {
    const reqDetails = this.getReqDetails()
    if (!reqDetails[REQ_DURATION]) reqDetails[REQ_DURATION] = durationMs
  }
  get duration() {
    return this.getReqDetails()[REQ_DURATION]
  }

  getError = () => this[DETAILS][ERROR]
  addError = (ctxMod, ctxFun, error) => {
    const fun = 'addError'
    log.t(mod, fun, ``)
    if (RudiError.isRudiError(error) && !this[DETAILS][ERROR]) {
      this[DETAILS][ERROR] = error
    } else {
      const rudiError = RudiError.treatError(ctxMod, ctxFun, error)
      this.addError(ctxMod, ctxFun, rudiError)
    }
  }

  logInfo = (ctxMod, ctxFun, msg) => {
    log.i(ctxMod, ctxFun, `${msg}: ${this.apiCallMsg}`)
    log.sysInfo(`${msg}: ${this.reqDetailsMsg}`, '', this, ' ') //, `reqDetails: '${this.formatReqDetails()}'`
  }

  logErr = (ctxMod, ctxFun, err) => {
    const fun = 'logErr'
    log.t(ctxMod, fun, ``)
    if (!err && !this.getError()) throw new RudiError('No error found in current context')
    this.addError(ctxMod, ctxFun, err)
    const error = this.getError()
    const primeError = error.primeError

    const errMsg = `Error ${error.statusCode} (${error.name}): ${error.message}`
    const errDetails =
      `${ERR_PLACE}: '${primeError.mod}.${primeError.fun}', ` +
      `${ERR_ON_REQ}: '${this.formatReqDetails()}'`

    log.sysOnError(error.statusCode, errMsg, this, errDetails)
  }

  get errorLocation() {
    const fun = 'getErrorLocation'
    log.t(mod, fun, ``)
    const err = this.getError()
    log.d(mod, fun, `${beautify(err)}`)
    if (err) {
      if (err.primeError) return `${err.primeError.mod}.${err.primeError.fun}`
      else log.w(mod, fun, beautify(err))
    }
    return undefined
  }
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
    const redirections = headers['x-forwarded-for'] || headers['X-Forwarded-For']
    if (Array.isArray(redirections)) return redirections
    if (typeof redirections === 'string') return redirections.split(',')
    if (!redirections) return
    log.d(mod, 'extractIpRedirections', `redirections: ${beautify(redirections)}`)
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
        return context.apiCallMsg
      }
    } catch (err) {
      throw RudiError.treatError(mod, fun, err)
    }
  }
}
