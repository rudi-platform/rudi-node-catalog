const mod = 'postmanTests'
// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import { run } from 'newman'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { readJsonFile } from '../utils/fileActions.js'
import { beautify } from '../utils/jsUtils.js'

// -------------------------------------------------------------------------------------------------
// Check local environment
// -------------------------------------------------------------------------------------------------
const rudiEnv = process.env?.CI_COMMIT_BRANCH || 'test'

// -------------------------------------------------------------------------------------------------
// Initialization
// -------------------------------------------------------------------------------------------------
const postmanCollectionFile = 'tests/rudi-soft-checks.postman_collection.json'
const collection = readJsonFile(postmanCollectionFile)

collection.pmClientName = `rudi_api_pm_${rudiEnv}`

const postmanEnvFile = `tests/env-rudi-${rudiEnv}.postman_environment.json`
const environment = readJsonFile(postmanEnvFile)
const reporters = 'cli'
const bail = true // If true, we stop on first error.

// -------------------------------------------------------------------------------------------------
// Running tests
// -------------------------------------------------------------------------------------------------
const failedAssertions = []
run({ collection, environment, reporters, bail }, (err) => {
  if (err) {
    console.error(`ERR: newman execution raised an error: ${err}`)
    process.exit(1)
  } else {
    if (failedAssertions.length) {
      console.error(`ERR: some of the tests failed: ${beautify(failedAssertions)}`)
      process.exit(1)
    }
    console.log('DONE: collection run complete!')
  }
}).on('assertion', (err, o) => {
  if (!err) return
  // console.log(beautify(o))
  // console.log(beautify(o.item))
  const errorDetected = {
    'Request Name': o.item.name,
    'Error Message': o.error.message,
    'Request Details': `${o.item.request.method} ${o.item.request.url.path.join('/')} `,
    'Request #': o.cursor.position,
  }
  console.error(errorDetected)
  failedAssertions.push(errorDetected)
})
