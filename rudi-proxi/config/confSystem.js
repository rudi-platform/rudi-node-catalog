//———————————————————————————————————————————————————————————————
// Mongoose DB parameters
//———————————————————————————————————————————————————————————————
exports.DB_NAME = 'rudi_prod'
exports.DB_PORT = 27017
exports.DB_URL = `mongodb://127.0.0.1/${this.DB_NAME}`

exports.DB_LOGS = 'rudi_prod_logs'
exports.DB_LOGS_PORT = 27017
exports.DB_LOGS_URL = `mongodb://127.0.0.1/${this.DB_LOGS}`
