var R = require('ramda')
var sharedConfig = {
  'net1': {
    'net': {
      channels: {
        'httpPublic': {
          url: 'net1:8080'
        },
        'http': {
          url: 'net1:8081'
        },
        'socket': {
          file: '/testSocket/socket'
        }
      }
    },
    rpcOut: {
      'testRpcNoResponse': {
        to: 'net1',
        method: 'testNoResponse',
        requestSchema: {'type': 'object'},
        responseSchema: {'type': 'object'}
      },
      'testRpcAknowlegment': {
        to: 'net1',
        method: 'testAknowlegment',
        requestSchema: {'type': 'object'},
        responseSchema: {'type': 'object'}
      },
      'testRpcResponse': {
        to: 'net1',
        method: 'testResponse',
        requestSchema: {'type': 'object'},
        responseSchema: {'type': 'object'}
      },
      'testRpcStream': {
        to: 'net1',
        method: 'testStream',
        requestSchema: {'type': 'object'},
        responseSchema: {'type': 'object'}
      }
    },
    eventsOut: {
      'testEvent': {
        multipleResponse: false,
        requestSchema: {'type': 'object'},
        responseSchema: {'type': 'object'}
      }
    },
    'eventsIn': {
      testEvent: {
        method: 'testResponse'
      }
    },
    'methods': {
      'testNoResponse': {
        public: true,
        responseType: 'noResponse',
        responseSchema: {'type': 'object'},
        requestSchema: {'type': 'object'}
      },
      'testAknowlegment': {
        public: true,
        responseType: 'aknowlegment',
        responseSchema: {'type': 'object'},
        requestSchema: {'type': 'object'}
      },
      'testResponse': {
        public: true,
        responseType: 'response',
        responseSchema: {'type': 'object'},
        requestSchema: {'type': 'object'}
      },
      'testStream': {
        public: true,
        responseType: 'stream',
        responseSchema: {'type': 'object'},
        requestSchema: {'type': 'object'}
      }
    }
  }
}
sharedConfig.net2 = R.merge(sharedConfig.net1, {
  net: {
    channels: {
      'httpPublic': {
        url: 'net2:8080'
      },
      'http': {
        url: 'net2:8081'
      },
      'socket': {
        file: '/testSocket/socket'
      }
    }
  },
  'events.listen': {
    testEvent: {
      method: 'testResponse'
    }
  }
})
module.exports = sharedConfig
