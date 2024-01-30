const mod = 'postmanTests'
// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import { run } from 'newman' // require newman in your project

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { readJsonFile } from '../utils/fileActions.js'

// -------------------------------------------------------------------------------------------------
// Check local environment
// -------------------------------------------------------------------------------------------------
const rudiEnv = process.env?.CI_COMMIT_BRANCH || 'release'

// -------------------------------------------------------------------------------------------------
// Initialization
// -------------------------------------------------------------------------------------------------
const postmanCollectionFile = 'tests/rudi-soft-checks.postman_collection.json'
const collection = readJsonFile(postmanCollectionFile)

const postmanEnvFile = `tests/env-rudi-${rudiEnv}.postman_environment.json`
const environment = readJsonFile(postmanEnvFile)
const reporters = 'cli'

// -------------------------------------------------------------------------------------------------
// Running tests
// -------------------------------------------------------------------------------------------------
run({ collection, environment, reporters }, (err) => {
  if (err) throw err
  console.log('collection run complete!')
})
