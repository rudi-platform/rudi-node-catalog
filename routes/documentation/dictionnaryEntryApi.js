exports.addDictionnaryEntrySchema = {
  description: 'Create a new dictionary entry',
  tags: ['dictionary'],
  summary: 'Creates new dictionary entry with given values',
  body: {
    type: 'object',
    properties: {
      lang: { type: 'string' },
      text: { type: 'string' },
    }
  },
  response: {
    200: {
      description: 'Successful response',
      type: 'object',
      properties: {
        _id: { type: 'string' },
        lang: { type: 'string' },
        text: { type: 'string' },
      }
    }
  }
}