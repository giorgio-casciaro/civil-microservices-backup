module.exports = {
  rpcOut: {
    'testRpc': {
      to: 'test',
      method: 'create',
      requestSchema: {'type': 'object'},
      responseSchema: {'type': 'object'}
    }
  },
  eventsIn: {
    'testEvent': {
      method: 'testResponse'
    },
    'testEventMulti': {
      method: 'testResponse'
    }
  },
  eventsOut: {
    'viewReaded': {
      multipleResponse: true,
      requestSchema: {'type': 'object'},
      responseSchema: {'type': 'object'}
    },
    'viewRemoved': {
      multipleResponse: true,
      requestSchema: {'type': 'object'},
      responseSchema: {'type': 'object'}
    },
    'viewCreated': {
      multipleResponse: true,
      requestSchema: {'type': 'object'},
      responseSchema: {'type': 'object'}
    }
  },
  methods: {
    'createView': {
      public: true,
      responseType: 'response',
      responseSchema: {'type': 'object'},
      requestSchema: {'type': 'object'}
    },
    'readView': {
      public: true,
      responseType: 'response',
      responseSchema: {'type': 'object'},
      requestSchema: {'type': 'object'}
    },
    'updateView': {
      public: true,
      responseType: 'response',
      responseSchema: {'type': 'object'},
      requestSchema: {'type': 'object'}
    },
    'removeView': {
      public: true,
      responseType: 'response',
      responseSchema: {'type': 'object'},
      requestSchema: {'type': 'object'}
    }
  }
}
