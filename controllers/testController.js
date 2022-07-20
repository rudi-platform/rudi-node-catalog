const mod = 'devCtrl'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { isReferencedInMetadata } from '../db/dbQueries.js'
import RudiError from '../utils/errors.js'
import { logD } from '../utils/logging.js'

// -------------------------------------------------------------------------------------------------
// tests
// -------------------------------------------------------------------------------------------------
export const test = async (req, reply) => {
  const fun = 'test'
  try {
    const reqSearch = req.url.substring(req.url.indexOf('?'))
    const searchParams = new URLSearchParams(reqSearch)
    const rudiId = searchParams.get('id')
    const objectType = searchParams.get('type')
    logD(mod, fun, rudiId)

    return await isReferencedInMetadata(objectType, rudiId)
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}
