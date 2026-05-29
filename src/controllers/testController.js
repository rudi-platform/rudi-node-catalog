const mod = 'devCtrl'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { RudiError } from '../utils/errors.js'

// -------------------------------------------------------------------------------------------------
// tests
// -------------------------------------------------------------------------------------------------
export const test = async (req, reply) => {
  const fun = 'test'
  try {
    // const reqSearch = req.url.slice(req.url.indexOf('?'))
    // const searchParams = new URLSearchParams(reqSearch)
    // const rudiId = searchParams.get('id')
    // const objectType = searchParams.get('type')
    // logD(mod, fun, rudiId)

    // return await isReferencedInMetadata(objectType, rudiId)
    reply.code(200).send({ test: 'ok' })
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
}
