const mod = 'migration'

import fs from 'fs/promises'
import mongoose from 'mongoose'
import path from 'path'

import { getConf } from '../src/config/appOptions.js'
import { getDbFullUri } from '../src/config/confSystem.js'
import { logD, logE, logI } from '../src/utils/logging.js'
import { Migration } from './model/migrationSchema.js'

const MIGRATION_SECTION = 'migration'
const AUTO_UPDATE_SCHEMAS = getConf(MIGRATION_SECTION, 'auto_update_schema', true)
const DISABLE_DB_LOGGING = true
const MIGRATIONS_DIR = './migrations/scripts'
const BACKUPS_DIR = getConf(MIGRATION_SECTION, 'backups_dir', './migrations/backups')
const MONGODB_URI = process.env.MONGODB || getDbFullUri()

// Logger that disables log writing in the database to avoid noise during migrations
const logNoDB = {
  debug: (mod, fun, msg) => logD(mod, fun, msg, !DISABLE_DB_LOGGING),
  info: (mod, fun, msg) => logI(mod, fun, msg, !DISABLE_DB_LOGGING),
  error: (mod, fun, msg) => logE(mod, fun, msg, !DISABLE_DB_LOGGING),
}

// Dedicated Mongoose connection for migrations (separate from the executeMigrations app connection)
const migrationConnection = mongoose.createConnection()

// Migration model bound to the dedicated connection
const MigrationModel = migrationConnection.model('Migration', Migration.schema)

/**
 * Creates a backup file with a given name and payload in JSON format.
 * The file is stored in a designated backup directory with a timestamp appended to the name.
 *
 * @param {string} name The base name for the backup file.
 * @param {Object} payload The data to be written into the backup file in JSON format.
 * @return {Promise<string>} Returns a promise that resolves to the full path of the created backup file.
 */
async function createBackupFile(name, payload) {
  const fun = 'createBackupFile'
  const timestamp = new Date().toISOString().replace(/[:\.]/g, '-')
  const filename = `${name}_${timestamp}.json`
  const backupPath = path.join(BACKUPS_DIR, filename)
  await fs.mkdir(BACKUPS_DIR, { recursive: true })
  await fs.writeFile(backupPath, JSON.stringify(payload, null, 2), 'utf8')
  logNoDB.debug(mod, fun, `Backup created: ${backupPath}`)
  return backupPath
}

/**
 * Dumps the entire database by retrieving all collections and their documents,
 * creates a backup containing these details, and saves it to a file.
 *
 * @return {Promise<string>} The file path of the created database backup.
 */
async function dumpDatabase() {
  const fun = 'dumpDatabase'
  logNoDB.info(mod, fun, 'Full database dump...')
  const db = migrationConnection.db
  const collections = await db.listCollections().toArray()
  const dump = {}
  for (const { name } of collections) {
    // eslint-disable-next-line no-await-in-loop
    const docs = await db.collection(name).find({}).toArray()
    dump[name] = docs
  }
  const backupPath = await createBackupFile('db_backup', {
    dbName: db.databaseName,
    createdAt: new Date().toISOString(),
    collections: dump,
  })
  return backupPath
}

/**
 * Restores the database from a specified backup file.
 * The backup file should contain a valid JSON structure with collections and their respective documents.
 * Existing collections will be dropped and recreated before inserting the backed-up data.
 *
 * @param {string} backupPath - The file path to the backup JSON file to be used for restoring the database.
 * @return {Promise<void>} A promise that resolves when the database restoration process is completed successfully.
 * @throws {Error} Throws an error if the backup file is invalid or if any issues occur during the restoration process.
 */
async function restoreDatabase(backupPath) {
  const fun = 'restoreDatabase'
  logNoDB.error(mod, fun, `Restoring from ${backupPath}...`)
  const db = migrationConnection.db
  const snapshot = JSON.parse(await fs.readFile(backupPath, 'utf8'))

  // Safety: validate structure
  if (!snapshot?.collections || typeof snapshot.collections !== 'object') {
    throw new Error('Invalid backup: missing collections')
  }

  // For each collection in the snapshot: drop if existing, recreate, reinsert
  for (const [name, docs] of Object.entries(snapshot.collections)) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const existing = await db.listCollections({ name }).toArray()
      if (existing.length > 0) {
        // eslint-disable-next-line no-await-in-loop
        await db.collection(name).drop()
      }
      // eslint-disable-next-line no-await-in-loop
      await db.createCollection(name)
      if (Array.isArray(docs) && docs.length > 0) {
        // eslint-disable-next-line no-await-in-loop
        await db.collection(name).insertMany(docs)
      }
      logNoDB.debug(mod, fun, `Collection restored: ${name} (${docs?.length || 0} docs)`)
    } catch (e) {
      logNoDB.error(mod, fun, `Collection restore error '${name}': ${e.message}`)
      throw e
    }
  }
  logNoDB.info(mod, fun, 'Restore completed')
}

/**
 * Determines whether a migration is needed by comparing the version of the last script
 * with the database's last recorded version.
 *
 * @param {string[]} files - An array of file names, where each file's version is represented by the first three characters of the name.
 * @param {number} lastVersion - The last recorded version in the database.
 * @return {boolean} True if the script's latest version is greater than the database's last recorded version; otherwise, false.
 */
function needMigration(files, lastVersion) {
  const fun = 'needMigration'
  const scriptsLastVersion = parseInt(files[files.length - 1].substring(0, 3))
  logNoDB.debug(
    mod,
    fun,
    `scriptsLastVersion: ${scriptsLastVersion}, databaseLastVersion: ${lastVersion}`
  )
  return scriptsLastVersion > lastVersion
}

/**
 * Retrieves and filters migration files from the specified directory.
 * Only files with names starting with three digits, followed by a double underscore, and ending with `.js` are returned.
 * The files are sorted in ascending lexicographical order.
 *
 * @return {Promise<string[]>} A promise that resolves to an array of migration file names matching the specified pattern.
 * @throws {Error} If there is an issue accessing the directory or reading the files.
 */
async function getMigrationFiles() {
  const fun = 'getMigrationFiles'

  logNoDB.debug(mod, fun, `Getting migration files... ${MIGRATIONS_DIR}`)

  try {
    const files = await fs.readdir(MIGRATIONS_DIR)
    logNoDB.debug(mod, fun, `Files found: ${files.join(', ')}`)
    // Filter: 3 digits + double underscore + .js, lexicographic ascending sort
    return files.filter((file) => file.match(/^\d{3}__.*\.js$/)).sort((a, b) => a.localeCompare(b))
  } catch (err) {
    logNoDB.error(mod, fun, `ERROR - could not get migration files: ${err.message}`)
    throw err // Propagate the error to the upper level
  }
}

/**
 * Retrieves the version number of the last recorded migration from the database.
 *
 * @return {Promise<number>} A promise that resolves to the version number of the last migration.
 * If no migrations exist, it resolves to 0. Rejects with an error if the operation fails.
 */
async function getLastMigrationVersion() {
  const fun = 'getLastMigrationVersion'
  logNoDB.debug(mod, fun, 'Getting last migration version from database...')
  try {
    const lastMigration = await MigrationModel.findOne({}).sort({ version: -1 })
    return lastMigration ? lastMigration.version : 0
  } catch (err) {
    logNoDB.error(mod, fun, `ERROR - could not get last migration version: ${err.message}`)
    throw err // Propagate the error to the upper level
  }
}

/**
 * Records a migration process in the database with the given filename and version.
 * This function logs the migration being recorded and stores relevant details in the database.
 *
 * @param {string} filename - The name of the migration file that is being recorded.
 * @param {string|number} version - The version of the migration being recorded.
 * @return {Promise<void>} Resolves when the migration has been successfully recorded in the database.
 */
async function recordMigration(filename, version) {
  const fun = 'recordMigration'
  logNoDB.debug(mod, fun, `Recording migration ${filename} with version ${version} in database...`)
  await MigrationModel.create({
    version: version,
    file: filename,
    date: new Date(),
  })
}

/**
 * Asynchronously imports a migration file module.
 *
 * @param {string} filename - The name of the migration file to be imported.
 * @return {Promise<object>} Resolves with an object containing the imported module, or rejects with an error if the operation fails.
 */
async function importMigrationFile(filename) {
  const fun = 'importMigrationFile'
  logNoDB.debug(mod, fun, `Importing migration file ${filename}`)
  try {
    const migrationPath = path.join(process.cwd(), MIGRATIONS_DIR, filename)
    const fileUrl = new URL(`file://${migrationPath.replace(/\\/g, '/')}`)
    const module = await import(fileUrl)
    return { module }
  } catch (error) {
    logNoDB.error(mod, fun, `Error while importing file ${filename}: ${error.message}`)
    throw error
  }
}

/**
 * Executes a migration defined in the specified file. The function imports the migration file,
 * validates the existence of a migrate function, runs the migration, and logs the process.
 *
 * @param {string} filename - The name of the migration file to be executed.
 * @param {string} version - The version identifier of the migration being executed.
 * @return {Promise<boolean>} - Resolves to true if the migration is successfully completed.
 * @throws {Error} - Throws an error if the migration file is invalid or if any issues occur during execution.
 */
async function runMigration(filename, version) {
  const fun = 'runMigration'
  logNoDB.info(mod, fun, `Running migration: ${filename}`)
  try {
    const { module: migrationModule } = await importMigrationFile(filename)

    if (typeof migrationModule.migrate !== 'function') {
      throw new Error(`Migration file ${filename} does not expose a 'migrate' function`)
    }

    await migrationModule.migrate({ connection: migrationConnection })
    await recordMigration(filename, version)
    logNoDB.info(mod, fun, `Migration ${filename} completed successfully`)
    return true
  } catch (error) {
    logNoDB.error(mod, fun, `Error during migration ${filename}: ${error.message}`)
    throw error
  }
}

/**
 * Executes database migrations to ensure the schema is up to date. Handles database connection,
 * checks for pending migration files, and applies migrations in sequence when necessary.
 * Provides error handling and attempts to restore the database in case of migration failure.
 *
 * @return {Promise<boolean>} A promise that resolves to true if all migrations are successfully executed
 *                            or no migrations are required; throws an error otherwise.
 */
export async function runMigrations(isDirect = false) {
  const fun = 'runMigrations'
  let dbBackupPath
  try {
    await migrationConnection.openUri(MONGODB_URI)
    logNoDB.debug(mod, fun, `Connected to MongoDB at ${MONGODB_URI}`)

    const lastVersion = await getLastMigrationVersion()
    logNoDB.info(mod, fun, `Last executed version: ${lastVersion}`)

    const migrationFiles = await getMigrationFiles()
    logNoDB.info(mod, fun, `Total number of migration files: ${migrationFiles?.length || 0}`)

    if (!migrationFiles || migrationFiles.length === 0) {
      logNoDB.info(mod, fun, 'No migration file found')
      return true
    }
    if (!needMigration(migrationFiles, lastVersion)) {
      logNoDB.info(mod, fun, `No migration needed`)
      return true
    }

    logNoDB.info(mod, fun, `Migration is required`)
    if (!AUTO_UPDATE_SCHEMAS && !isDirect) {
      logNoDB.error(mod, fun, `The application cannot start; schemas must be updated beforehand.`)
      process.exit(-1)
    }
    logNoDB.info(mod, fun, `Launching migration process`)

    // dump database before any migration
    dbBackupPath = await dumpDatabase()
    logNoDB.info(mod, fun, `DB dumped at '${dbBackupPath}'`)

    await migrateFiles(migrationFiles, lastVersion)
    logNoDB.info(mod, fun, `All migration files were executed.`)

    return true
  } catch (error) {
    logNoDB.error(mod, fun, `Error while running migrations ${error.message}:`)
    // if something went wrong, try to restore the database
    if (dbBackupPath) {
      try {
        await restoreDatabase(dbBackupPath)
        logNoDB.info(mod, fun, 'Database restored after migration failure')
      } catch (restoreErr) {
        logNoDB.error(mod, fun, `Restore failed: ${restoreErr.message}`)
      }
    }
    return false
  }
}

async function migrateFiles(migrationFiles, lastVersion) {
  const fun = 'migrateFiles'
  for (const file of migrationFiles) {
    logNoDB.info(mod, fun, 'Migration files: ' + migrationFiles.join(','))
    logNoDB.info(mod, fun, 'Selected file: ' + file)

    const currentVersion = Number.parseInt(file.substring(0, 3))
    if (currentVersion <= lastVersion) {
      logNoDB.debug(mod, fun, `Migration ${file} already executed, skipping`)
      continue
    }

    // eslint-disable-next-line no-await-in-loop
    await runMigration(file, currentVersion)
  }

  logNoDB.info(mod, fun, 'All migrations executed successfully')
  return true
}

// --- graceful closure ---
async function closeGracefully() {
  const fun = 'closeGracefully'
  // Close Mongoose if a connection is open
  try {
    if (mongoose?.connection?.readyState === 1 || mongoose?.connection?.readyState === 2) {
      await mongoose.connection.close(false)
    }
  } catch (e) {
    logNoDB.error(mod, fun, `Error closing Mongoose connection: ${e.message}`)
  }
}

// --- Standalone launcher ---
async function executeMigrations(isDirect = false) {
  const fun = 'executeMigrations'
  const ok = await runMigrations(isDirect)
  logNoDB.info(mod, fun, `Migration process ended with status ${ok ? 'OK' : 'ERROR'}`)
  try {
    await closeGracefully()
    logNoDB.info(mod, fun, 'Mongoose connection closed')
  } finally {
    process.exit(ok ? 0 : 1)
  }
}

async function checkMigration() {
  const fun = 'checkMigration'
  // If run directly via `node ./migrations/runMigration.js`, execute executeMigrations()
  // If imported by the app (rudiNodeCatalog.js), do not call executeMigrations() and let the app manage the lifecycle
  if (import.meta?.url && typeof process !== 'undefined') {
    logNoDB.debug(mod, fun, '')
    // Défine import logic
    const isImported = typeof require === 'undefined'
    logNoDB.info(mod, fun, `isImported: ${isImported}`)
    const isDirectByRequire = !isImported && require.main === module
    logNoDB.info(mod, fun, `isDirectByRequire: ${isDirectByRequire}`)

    const isDirectByImport =
      isImported &&
      process.argv[1] &&
      new URL(import.meta.url).pathname.endsWith(process.argv[1].split(/[\\/]/).pop())
    logNoDB.info(mod, fun, `isDirectByImport: ${isDirectByImport}`)

    const isDirect = isDirectByImport || isDirectByRequire
    logNoDB.info(mod, fun, `isDirect: ${isDirect}`)

    if (isDirect) {
      await executeMigrations(isDirect)
    }
    // Else this file is only imported or required by the app, so do not execute migrations here
    // The app will manage the lifecycle and call runMigrations() when needed
  }
}

checkMigration().then(
  () => logNoDB.info(mod, 'checkMigration', 'Execution OK'),
  (err) => logNoDB.error(mod, 'checkMigration', `Execution KO: ${err}`)
)
