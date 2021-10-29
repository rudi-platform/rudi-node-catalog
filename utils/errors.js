'use strict'

const mod = 'custErr'

const { isArray } = require('./jsUtils')
// ------------------------------------------------------------------------------------------------
// Internal dependencies
// ------------------------------------------------------------------------------------------------
const log = require('./logging')
const { objectNotFound, parameterExpected } = require('./msg')

// ------------------------------------------------------------------------------------------------
// Http errors
// ------------------------------------------------------------------------------------------------
const DEFAULT_MESSAGE = 'Rudi producer node - API Server Error'

class RudiHttpError extends Error {
  constructor(message, code, name, description) {
    super(message || DEFAULT_MESSAGE)
    this.isRudiHttpError = true
    this.isRudiError = true
    this.statusCode = code || 500
    this.name = name || 'Internal Server Error'
    this.error = description || 'An unexpected error occured'
    this.type = this.constructor.name
  }
  toString() {
    return `Error ${this.statusCode} (${this.name}): ${this.message}`
  }
  toJSON() {
    return {
      statusCode: this.statusCode,
      type: this.constructor.name,
      name: this.name,
      error: this.error,
      message: this.message,
    }
  }
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
    throw this.treatError(err, { mod: mod, fun: fun })
  }
}

// ------------------------------------------------------------------------------------------------
// Errors
// ------------------------------------------------------------------------------------------------
const CONTEXT = 'app_context'
const ERR = 'err'

const treatError = (error, errContext) => {
  const fun = 'treatError'
  try {
    if (!error) throw new Error(`Input error shouldn't be null`)
    // log.d(mod, fun, beautify(error))
    // log.d(mod, fun, error.isRudiError)
    if (!errContext[ERR]) errContext[ERR] = error //|| error.toString()
    const { mod: ctxMod, fun: ctxFun, [ERR]: ctxErr } = errContext
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

const showErrorPile = (error) => {
  // const fun = 'showErrorPile'
  const errContext = error[CONTEXT]
  if (!errContext) return
  errContext.map((err) => {
    log.w(err.mod, err.fun, `${err[ERR]}`)
  })
}

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
  treatError,
  showErrorPile,
  CONTEXT,
}
