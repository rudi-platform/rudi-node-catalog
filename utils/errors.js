'use strict'

const mod = 'custErr'

const { TRACE, CONTEXT, IS_RUDI_HTTP_ERROR, STATUS_CODE } = require('../config/confApi')
// ------------------------------------------------------------------------------------------------
// Internal dependencies
// ------------------------------------------------------------------------------------------------
const { isArray } = require('./jsUtils')
const log = require('./logging')
const { objectNotFound, parameterExpected } = require('./msg')

// ------------------------------------------------------------------------------------------------
// Cosntants
// ------------------------------------------------------------------------------------------------
const DEFAULT_MESSAGE = 'Rudi producer node - API Server Error'

// ------------------------------------------------------------------------------------------------
// Helper functions
// ------------------------------------------------------------------------------------------------

const isRudiHttpError = (error) => typeof error[IS_RUDI_HTTP_ERROR] !== 'undefined'

function treatError(error, errContext) {
  const fun = 'treatError'
  try {
    if (!error)
      throw new ParameterExpectedError('treatError', `Input parameter 'error' shouldn't be null`)
    if (!errContext)
      throw new ParameterExpectedError(
        'treatError',
        `Input parameter 'errContext' shouldn't be null`
      )
    // log.d(mod, fun, beautify(error))
    // log.d(mod, fun, error.isRudiError())
    if (!errContext[TRACE]) errContext[TRACE] = error //|| error.toString()
    const { mod: ctxMod, fun: ctxFun, [TRACE]: ctxErr } = errContext
    // log.d(ctxMod, ctxFun, beautify(ctxErr))
    if (!error[CONTEXT]) {
      error[CONTEXT] = [errContext]
    } else if (!isArray(error[CONTEXT])) {
      const msg = `Reserved field '${CONTEXT}' should be an array`
      log.w(ctxMod, ctxFun, msg + `Original error: ${ctxErr}`)
      throw new Error(msg)
    } else {
      error[CONTEXT].push(errContext)
    }
    return error
  } catch (err) {
    log.w(mod, fun, err)
    throw err
  }
}

function createRudiHttpError(code, message) {
  const fun = 'createRudiHttpError'
  try {
    log.d(mod, fun, `Error ${code}: ${message}`)
    switch (code) {
      case 400:
        return new BadRequestError(message)
      case 401:
        return new UnauthorizedError(message)
      case 403:
        return new ForbiddenError(message)
      case 404:
        return new NotFoundError(message)
      case 405:
        return new MethodNotAllowedError(message)
      case 406:
        return new NotAcceptableError(message)
      case 501:
        return new NotImplementedError(message)
      case 500:
      default:
        return new InternalServerError(message)
    }
  } catch (err) {
    // consoleErr(mod, fun, err)
    throw treatError(err, { mod: mod, fun: fun })
  }
}
// ------------------------------------------------------------------------------------------------
// Custom http errors
// ------------------------------------------------------------------------------------------------
class RudiHttpError extends Error {
  constructor(message, code, name, description) {
    super(message || DEFAULT_MESSAGE)
    this[IS_RUDI_HTTP_ERROR] = true
    this[STATUS_CODE] = code || 500
    this.name = name || 'Internal Server Error'
    this.error = description || 'An unexpected error occured'
    this.type = this.constructor.name
  }
  toString() {
    return `Error ${this[STATUS_CODE]} (${this.name}): ${this.message}`
  }
  toJSON() {
    return {
      [STATUS_CODE]: this[STATUS_CODE],
      type: this.constructor.name,
      name: this.name,
      error: this.error,
      message: this.message,
    }
  }
  logErrorPile() {
    const fun = 'logErrorPile'
    try {
      const errContext = this[CONTEXT]
      if (!errContext) return
      errContext.map((err) => {
        log.w(err.mod, err.fun, `${err[TRACE]}`)
      })
    } catch (err) {
      throw treatError(err, { mod: mod, fun: fun })
    }
  }
  statusCode = () => this[STATUS_CODE]
}

class BadRequestError extends RudiHttpError {
  constructor(errMessage) {
    super(errMessage, 400, 'Bad request', 'The JSON is not valid')
  }
}

class UnauthorizedError extends RudiHttpError {
  constructor(errMessage) {
    super(errMessage, 401, 'Unauthorized', 'The request requires an user authentication')
  }
}

class ForbiddenError extends RudiHttpError {
  constructor(errMessage) {
    super(errMessage, 403, 'Forbidden', 'The access is not allowed')
  }
}

class NotFoundError extends RudiHttpError {
  constructor(errMessage) {
    super(errMessage, 404, 'Not Found', 'The resource was not found')
  }
}

class ObjectNotFoundError extends NotFoundError {
  constructor(objectType, objectId) {
    super(`${objectNotFound(objectType, objectId)}`)
  }
}

class MethodNotAllowedError extends RudiHttpError {
  constructor(errMessage) {
    super(
      errMessage,
      405,
      'Method Not Allowed',
      'Request method is not supported for the requested resource'
    )
  }
}

class NotAcceptableError extends RudiHttpError {
  constructor(errMessage) {
    super(
      errMessage,
      406,
      'Not Acceptable',
      'Headers sent in the request are not compatible with the service'
    )
  }
}

class InternalServerError extends RudiHttpError {
  constructor(errMessage) {
    super(errMessage, 500, 'Internal Server Error', 'Internal Server Error')
  }
}

class ParameterExpectedError extends InternalServerError {
  constructor(fun, param) {
    super(`${parameterExpected(fun, param)}`)
  }
}

class NotImplementedError extends RudiHttpError {
  constructor(errMessage) {
    super(
      errMessage,
      501,
      'Not Implemented',
      'The server does not support the functionality required to fulfill the request'
    )
  }
}

// ------------------------------------------------------------------------------------------------
// Exports
// ------------------------------------------------------------------------------------------------

module.exports = {
  RudiHttpError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ObjectNotFoundError,
  MethodNotAllowedError,
  NotAcceptableError,
  InternalServerError,
  ParameterExpectedError,
  NotImplementedError,
  createRudiHttpError,
  isRudiHttpError,
  treatError,
}
