import { RudiError } from '../../src/utils/errors.js'

const mod = 'migrationsSchema'

import mongoose from 'mongoose'
import { FIELDS_TO_SKIP } from '../../src/db/dbFields.js'
import _ from 'lodash'
import { makeSearchable } from '../../src/db/dbActions.js'

const VERSION = 'version'
const DATE = 'date'
const FILE = 'file'

const { omit } = _

const MigrationSchema = new mongoose.Schema(
  {
    [VERSION]: {
      type: Number,
      required: true,
    },
    [DATE]: { type: Date, default: Date.now, required: true },
    [FILE]: {
      type: String,
      required: true,
    },
  },
  {
    id: true,
    strict: true,
  }
)

MigrationSchema.methods.toJSON = function () {
  return omit(this.toObject(), FIELDS_TO_SKIP)
}

export const Migration = mongoose.model('Migration', MigrationSchema)

Migration.getSearchableFields = () => [VERSION, DATE, FILE]

Migration.initialize = async () => {
  const fun = 'initMigration'
  try {
    await makeSearchable(Migration)
    return 'Migration indexes created'
  } catch (err) {
    RudiError.treatError(mod, fun, err)
  }
}
// -------------------------------------------------------------------------------------------------
// Exports
// -------------------------------------------------------------------------------------------------
export default Migration
