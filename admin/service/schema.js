var jsFields = {
  schema: { type: 'object'},
  response: { type: 'object' }
}

module.exports = {
  rpcOut: {
  },
  eventsIn: {

  },
  eventsOut: {

  },
  methods: {
    'getSchema': {
      public: true,
      responseType: 'response',
      requestSchema: {},
      responseSchema: { properties: { schema: jsFields.schema }, 'additionalProperties': true }
    },
    'proxy': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: {
          service: { type: 'string' },
          method: { type: 'string' },
          data: { type: 'object' },
          meta: { type: 'object' }
        }
      },
      responseSchema: { 'additionalProperties': true }
    }
  }
}
