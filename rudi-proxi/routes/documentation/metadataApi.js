const DictionaryEntry = require('./dictionnaryEntryApi')

exports.addMetadataSchema = {
  description: 'Create a new metadata',
  tags: ['metadata'],
  summary: 'Creates new metadata with given values',
  body: {
    type: 'object',
    properties: {
      global_id: { type: 'string' },
      local_id: { type: 'string' },
      doi: { type: 'string' },
      resource_title: { type: 'string' },
      summary: { type: 'object' },
      purpose: { type: 'string' },
      resource_language: { type: 'string' },
    }
  },
  response: {
    200: {
      description: 'Successful response',
      type: 'object',
      properties: {
        _id: { type: 'string' },
        global_id: { type: 'string' },
        local_id: { type: 'string' },
        doi: { type: 'string' },
        resource_title: { type: 'string' },
        summary: { type: 'object' },
        purpose: { type: 'string' },
        resource_language: { type: 'string' },
          __v: { type: 'number' }
      }
    }
  }
}