const mod = 'extrasSch'

// -------------------------------------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------------------------------------
import { API_EXTRAS } from '../../db/dbFields.js'

/**
 * Maximum number of nested containers (objects/arrays) above a leaf value.
 * With a depth of 3, 'extras: { a: { b: [c, d], e: f } }' is valid:
 * 'a' is at depth 1, 'b' and 'e' at depth 2, 'c', 'd' and 'f' at depth 3.
 * An array at the root is counted the same way: its elements are at depth 1.
 */
export const EXTRAS_MAX_DEPTH = 3

/** Keys that would break MongoDB updates or allow prototype pollution */
const FORBIDDEN_KEYS = ['__proto__', 'constructor', 'prototype']

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { BadRequestError, RudiError } from '../../utils/errors.js'

// -------------------------------------------------------------------------------------------------
// Helper functions
// -------------------------------------------------------------------------------------------------
const isPlainObject = (value) => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

const isJsonScalar = (value) =>
  value === null ||
  typeof value === 'string' ||
  typeof value === 'boolean' ||
  (typeof value === 'number' && Number.isFinite(value))

const isForbiddenKey = (key) =>
  key.length === 0 || key.includes('.') || key.startsWith('$') || FORBIDDEN_KEYS.includes(key)

const stringifyPath = (path) =>
  path.reduce(
    (str, segment) =>
      typeof segment === 'number' ? `${str}[${segment}]` : str ? `${str}.${segment}` : segment,
    ''
  )

/**
 * Looks for the first invalid value in an 'extras' value (JSON object or array).
 * Allowed leaves are JSON scalars (string, finite number, boolean, null).
 * Objects must be plain objects, arrays must contain allowed values only,
 * and no container may be nested deeper than 'maxDepth'.
 *
 * @param {*} extras the value of the 'extras' property
 * @param {Number} maxDepth maximum nesting depth (default: EXTRAS_MAX_DEPTH)
 * @return {{ pathArray: Array, reason: String }|null} the first error, or null if valid
 */
export const findExtrasError = (extras, maxDepth = EXTRAS_MAX_DEPTH) => {
  const fail = (pathArray, reason) => ({ pathArray, reason })

  const validate = (value, pathArray, depth) => {
    if (isJsonScalar(value)) return null

    if (typeof value !== 'object' || value === null)
      return fail(pathArray, `only JSON values are allowed (found '${typeof value}')`)

    if (depth >= maxDepth) return fail(pathArray, `maximum nesting depth (${maxDepth}) exceeded`)

    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index++) {
        const error = validate(value[index], [...pathArray, index], depth + 1)
        if (error) return error
      }
      return null
    }

    if (!isPlainObject(value))
      return fail(
        pathArray,
        `only plain JSON objects are allowed (found '${value.constructor?.name}')`
      )

    for (const key of Object.keys(value)) {
      if (isForbiddenKey(key)) return fail([...pathArray, key], `forbidden key '${key}'`)
      const error = validate(value[key], [...pathArray, key], depth + 1)
      if (error) return error
    }
    return null
  }

  // 'extras' is optional
  if (extras == null) return null

  if (!isPlainObject(extras) && !Array.isArray(extras))
    return fail([API_EXTRAS], `must be a JSON object or array`)

  return validate(extras, [API_EXTRAS], 0)
}

/**
 * Formats the first error found in an 'extras' object.
 * @param {{ pathArray: Array, reason: String }} error
 * @return {String} a human-readable error message
 */
const formatExtrasError = (error) =>
  `Incorrect '${API_EXTRAS}' value at '${stringifyPath(error.pathArray)}': ${error.reason}`

/**
 * Throws a BadRequestError if the 'extras' value is not valid.
 * @param {*} extras the value of the 'extras' property
 * @return {Boolean} true if valid
 */
export const checkExtras = (extras, fun = 'checkExtras') => {
  try {
    const error = findExtrasError(extras)
    if (!error) return true

    throw new BadRequestError(formatExtrasError(error), mod, fun, error.pathArray)
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}

// -------------------------------------------------------------------------------------------------
// Custom schema definition
// -------------------------------------------------------------------------------------------------
export const ExtrasSchema = {
  type: Object,
  default: undefined,
  validate: {
    validator: (value) => findExtrasError(value) === null,
    // Report the precise path to the invalid value, in both sync and async validations
    message: (props) => {
      const error = findExtrasError(props.value)
      return error ? formatExtrasError(error) : `Incorrect '${API_EXTRAS}' value`
    },
  },
}

// -------------------------------------------------------------------------------------------------
// Exports
// -------------------------------------------------------------------------------------------------
export default ExtrasSchema
