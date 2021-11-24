'use strict'

const mod = 'custErr'

const {
  TRACE,
  IS_RUDI_HTTP_ERROR,
  STATUS_CODE,
  TRACE_MOD,
  TRACE_FUN,
  TRACE_ERR,
} = require('../config/confApi')
// ------------------------------------------------------------------------------------------------
// Internal dependencies
// ------------------------------------------------------------------------------------------------
const { beautify } = require('./jsUtils')
const log = require('./logging')
const { objectNotFound, parameterExpected } = require('./msg')

// ------------------------------------------------------------------------------------------------
// Cosntants
// ------------------------------------------------------------------------------------------------
const DEFAULT_MESSAGE = 'Rudi producer node - API Server Error'

// ------------------------------------------------------------------------------------------------
// Helper functions
// ------------------------------------------------------------------------------------------------

// ------------------------------------------------------------------------------------------------
// Custom http errors
// ------------------------------------------------------------------------------------------------
class RudiError extends Error {
  constructor(message, code, name, description, errTrace) {
    // const fun = 'RudiError()'
    // log.t(mod, fun, `${beautify(errTrace)}`)
    // const lastTrace = getLast(errTrace)
    // if (lastTrace) log.d(lastTrace.mod, lastTrace.fun, lastTrace.err)
    // else log.t(mod, fun, ``)
    super(message || DEFAULT_MESSAGE)
    this[IS_RUDI_HTTP_ERROR] = true
    this[STATUS_CODE] = code || 500
    this.name = name || 'Internal Server Error'
    this.error = description || 'An unexpected error occured'
    this.type = this.constructor.name
    this[TRACE] = errTrace || []
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

  static logErrorPile(error) {
    const fun = 'logErrorPile'
    try {
      const errContext = error[TRACE]
      if (!errContext) {
        log.w(mod, fun, `property '${TRACE}' not found`)
        return
      }
      errContext.map((previousErr) => {
        log.w(
          previousErr[TRACE_MOD],
          previousErr[TRACE_FUN],
          previousErr[TRACE_ERR].message || previousErr[TRACE_ERR]
        )
      })
    } catch (err) {
      throw RudiError.treatError(mod, fun, err)
    }
  }

  static isRudiHttpError = (error) => typeof error[IS_RUDI_HTTP_ERROR] !== 'undefined'

  static createNewRudiError(error, ctxMod, ctxFun) {
    // log.d(ctxMod, ctxFun, beautify(ctxErr))
    const errTrace = (error[TRACE] || []).concat({
      [TRACE_MOD]: ctxMod,
      [TRACE_FUN]: ctxFun,
      [TRACE_ERR]: error.message || error,
    })

    return new RudiError(
      error.message || error,
      error[STATUS_CODE],
      error.name,
      error.error,
      errTrace
    )
  }

  static createRudiHttpError(code, message) {
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
      throw RudiError.treatError(mod, fun, err)
    }
  }

  /**
   * Function used to aggregate errors in an error pile.
   * @param {string} error error message
   * @param {*} errLocation error location (mod: module/file, fun: function)
   * @returns
   */
  static treatError(ctxMod, ctxFun, error) {
    // const fun = 'treatError'
    try {
      if (!error) throw new ParameterExpectedError('treatError', 'error')
      if (!ctxMod) throw new ParameterExpectedError('treatError', 'ctxMod')
      if (!ctxFun) throw new ParameterExpectedError('treatError', 'ctxFun')

      // log.d(mod, fun, `A) ${error} -> ${beautify(error)}`)

      const errTrace = (error[TRACE] || []).concat({
        [TRACE_MOD]: ctxMod,
        [TRACE_FUN]: ctxFun,
        [TRACE_ERR]: error.message || error,
      })

      const transmittedError = new RudiError(
        error.message || error,
        error[STATUS_CODE],
        error.name,
        error.error,
        errTrace
      )
      // log.d(mod, fun, error.isRudiError())

      // log.d(mod, fun, `B) ${error} -> ${beautify(transmittedError)}`)
      return transmittedError
    } catch (err) {
      // log.w(mod, fun, err)
      throw err
    }
  }

  static treatCommunicationError(portalError, ctxMod, ctxFun) {
    const fun = 'treatCommunicationError'
    log.t(mod, fun, ``)

    let error
    try {
      if (portalError.response && portalError.response.data) {
        log.w(mod, fun, `details: ${beautify(portalError.response.data)}`)
      } else if (portalError.response) {
        log.w(mod, fun, `details: ${beautify(portalError.response)}`)
      }

      if (
        portalError.response &&
        portalError.response.data &&
        portalError.response.data.label &&
        portalError.response.data.code
      ) {
        error = RudiError.createRudiHttpError(
          portalError.response.data.code,
          portalError.response.data.label
        )
        error[TRACE] = { [TRACE_MOD]: ctxMod, [TRACE_FUN]: ctxFun, [TRACE_ERR]: portalError }
      } else if (portalError.response && portalError.response.data) {
        error = new Error(portalError.response.data)
        error[TRACE] = { [TRACE_MOD]: ctxMod, [TRACE_FUN]: ctxFun, [TRACE_ERR]: portalError }
      } else {
        if (portalError.response) {
          error = new Error(portalError.response)
          error[TRACE] = { [TRACE_MOD]: ctxMod, [TRACE_FUN]: ctxFun, [TRACE_ERR]: portalError }
        } else {
          error = portalError
          error[TRACE] = { [TRACE_MOD]: ctxMod, [TRACE_FUN]: ctxFun, [TRACE_ERR]: portalError }
        }
      }
      return error
    } catch (err) {
      throw RudiError.treatError(mod, fun, err)
    }
  }
}

class BadRequestError extends RudiError {
  constructor(errMessage) {
    super(errMessage, 400, 'Bad request', 'The JSON is not valid')
  }
}

class UnauthorizedError extends RudiError {
  constructor(errMessage) {
    super(errMessage, 401, 'Unauthorized', 'The request requires an user authentication')
  }
}

class ForbiddenError extends RudiError {
  constructor(errMessage) {
    super(errMessage, 403, 'Forbidden', 'The access is not allowed')
  }
}

class NotFoundError extends RudiError {
  constructor(errMessage) {
    super(errMessage, 404, 'Not Found', 'The resource was not found')
  }
}

class ObjectNotFoundError extends NotFoundError {
  constructor(objectType, objectId) {
    super(`${objectNotFound(objectType, objectId)}`)
  }
}

class MethodNotAllowedError extends RudiError {
  constructor(errMessage) {
    super(
      errMessage,
      405,
      'Method Not Allowed',
      'Request method is not supported for the requested resource'
    )
  }
}

class NotAcceptableError extends RudiError {
  constructor(errMessage) {
    super(
      errMessage,
      406,
      'Not Acceptable',
      'Headers sent in the request are not compatible with the service'
    )
  }
}

class InternalServerError extends RudiError {
  constructor(errMessage) {
    super(errMessage, 500, 'Internal Server Error', 'Internal Server Error')
  }
}

class ParameterExpectedError extends InternalServerError {
  constructor(fun, param) {
    super(`${parameterExpected(fun, param)}`)
  }
}

class NotImplementedError extends RudiError {
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
  RudiError,
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
}
