module.exports = {
  rpcOut: {
    'testRpc': {
      to: 'SERVICE2',
      method: 'testResponse',
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
    'create': {
      public: true,
      responseType: 'response',
      responseSchema: {'type': 'object'},
      requestSchema: {'type': 'object'}
    },
    'read': {
      public: true,
      responseType: 'response',
      responseSchema: {'type': 'object'},
      requestSchema: {'type': 'object'}
    },
    'update': {
      public: true,
      responseType: 'response',
      responseSchema: {'type': 'object'},
      requestSchema: {'type': 'object'}
    },
    'remove': {
      public: true,
      responseType: 'response',
      responseSchema: {'type': 'object'},
      requestSchema: {'type': 'object'}
    },
    'createCqrs': {
      public: true,
      responseType: 'response',
      responseSchema: {'type': 'object'},
      requestSchema: {'type': 'object'}
    },
    'readCqrs': {
      public: true,
      responseType: 'response',
      responseSchema: {'type': 'object'},
      requestSchema: {'type': 'object'}
    },
    'updateCqrs': {
      public: true,
      responseType: 'response',
      responseSchema: {'type': 'object'},
      requestSchema: {'type': 'object'}
    },
    'removeCqrs': {
      public: true,
      responseType: 'response',
      responseSchema: {'type': 'object'},
      requestSchema: {'type': 'object'}
    }
  }
}
