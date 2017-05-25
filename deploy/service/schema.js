var jsFields = {
  schema: { type: 'object'},
  response: { type: 'object' }
}

module.exports = {
  net: {
    'channels': {
      'httpPublic': {
        'url': `${process.env.netHost || '127.0.0.1'}:${process.env.netHostHttpPublicPort || '18080'}`,
        'cors': process.env.netCors || process.env.netHost || '127.0.0.1'
      },
      'http': { 'url': `${process.env.netHost || '127.0.0.1'}:${process.env.netHostHttpPort || '18081'}` }
    }
  },
  rpcOut: {
  },
  eventsIn: {

  },
  eventsOut: {

  },
  methods: {
    'analizeDev': {
      public: true,
      responseType: 'response',
      requestSchema: {},
      responseSchema: { properties: {  }, 'additionalProperties': true }
    }
  }
}
