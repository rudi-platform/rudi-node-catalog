const mod = 'contCtrl'
/*
 * In this file are made the different steps followed for each
 * action on the contacts (producer or publisher)
 */

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { beautify } from '../utils/jsUtils.js'
import { logD } from '../utils/logging.js'
import { RudiError } from '../utils/errors.js'

// -------------------------------------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------------------------------------

// -------------------------------------------------------------------------------------------------
// Data models
// -------------------------------------------------------------------------------------------------
import { Contact } from '../definitions/models/Contact.js'

// -------------------------------------------------------------------------------------------------
// Controller functions
// -------------------------------------------------------------------------------------------------
export const newContact = async (contactJson) => {
  const fun = 'newContact'
  logD(mod, fun, `${beautify(contactJson)}`)
  let dbContact
  try {
    dbContact = await new Contact(contactJson)
    await dbContact.save()
  } catch (err) {
    throw RudiError.treatError(mod, fun, err)
  }
  return dbContact
}
