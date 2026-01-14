const mod = 'migration_organizations_status'

import { logI, logT } from '../../src/utils/logging.js'

// Import the model module to get the Schema and enums
import * as OrganizationModule from '../../src/definitions/models/Organization.js'

/**
 * Builds and retrieves the Organization model using the provided database connection and schema.
 *
 * @param {Object} options - The configuration object.
 * @param {Object} options.connection - The database connection to use for associating the schema to the model.
 *
 * @return {Object} The Organization model associated with the database connection.
 * @throws {Error} If the 'Organization' schema is not found.
 */
function buildSchema({ connection }) {
  const fun = 'buildSchema'
  logT(mod, fun)

  // Create the model on the dedicated migration connection
  const schema =
    OrganizationModule.Organization?.schema ||
    OrganizationModule.schema ||
    OrganizationModule.default?.schema
  if (!schema) throw new Error("Schema 'Organization' not found")
  return connection.models?.Organization || connection.model('Organization', schema)
}

/**
 * Migrates specified organizations by updating their status based on predefined rules.
 *
 * @param {Object} param - The parameter object.
 * @param {Object} param.connection - The database connection to use for schema and operations.
 * @return {Promise<void>} A promise that resolves when the migration process completes.
 */
export async function migrate({ connection }) {
  const fun = 'migrateOrganizations'
  logT(mod, fun)

  // Create the model on the dedicated migration connection
  const Organization = buildSchema({ connection })
  const { LinkedProducerStatus, OrganizationStatus } = OrganizationModule

  let successCount = 0
  let errorCount = 0
  const errors = []

  try {
    const organizationsToUpdate = await Organization.find({
      $or: [
        { organization_status: { $exists: false } },
        {
          organization_status: OrganizationStatus.VALIDATED,
          linked_producer_status: { $exists: false },
        },
      ],
    })

    logI(mod, fun, `Number of organizations to update: ${organizationsToUpdate.length}`)

    for (const org of organizationsToUpdate) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await Organization.findByIdAndUpdate(org._id, {
          organization_status: OrganizationStatus.VALIDATED,
          linked_producer_status: LinkedProducerStatus.VALIDATED,
        })
        successCount++
      } catch (error) {
        errorCount++
        errors.push({ organizationId: org._id, error: error.message })
      }
    }

    logI(mod, fun, 'Migration report:')
    logI(mod, fun, `Organizations updated successfully: ${successCount}`)
    logI(mod, fun, `Failures: ${errorCount}`)
    if (errors.length > 0) {
      logI(mod, fun, 'Error details:')
      errors.forEach((err) => logI(mod, fun, `- Organization ${err.organizationId}: ${err.error}`))
    }
  } catch (error) {
    throw error
  }
}
