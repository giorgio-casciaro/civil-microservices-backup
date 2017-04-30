
var R = require('ramda')
var request = require('request')
var t = require('tap')
var path = require('path')

const getConsole = (serviceName, serviceId, pack) => require('../utils').getConsole({error: true, debug: true, log: false, warn: true}, serviceName, serviceId, pack)
var CONSOLE = getConsole('BASE TEST', '----', '-----')

var sharedConfig = {
  'net1': {
    'net': {
      channels: {
        'test': {
          url: 'localhost:8080'
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
      'test': {
        url: 'localhost:8082'
      }
    }
  },
  'events.listen': {
    testEvent: {
      method: 'testResponse'
    }
  }
})
sharedConfig.net3 = R.merge(sharedConfig.net1, {
  net: {
    channels: {
      'test': {
        url: 'localhost:8083'
      }
    }
  },
  'events.listen': {
    testEvent: {
      method: 'testNoResponse'
    }
  }
})
sharedConfig.net4 = R.merge(sharedConfig.net1, {
  net: {
    channels: {
      'test': {
        url: 'localhost:8084'
      }
    }
  },
  'events.listen': {
    testEvent: {
      method: 'testAknowlegment'
    }
  }
})
var meta = {
  corrid: 'testRequest',
  userid: 'testUser'
}

var testCheck = false
var stream
// var Methods = {
//   testNoResponse: async(data, meta) => { CONSOLE.debug('testNoResponse', {data, meta}); testCheck = data },
//   testAknowlegment: async(data, meta) => { testCheck = data },
//   testResponse: async(data, meta) => { testCheck = data; return data },
//   testStream: (data, meta, getStream) => {
//     CONSOLE.debug('testStream', {data, meta, getStream})
//     testCheck = data
//     var onClose = () => { CONSOLE.log('stream closed') }
//     stream = getStream(onClose, 120000)
//     stream.write({testStreamConnnected: 1})
//     setTimeout(() => stream.write({testStreamData: 1}), 500)
//     setTimeout(() => stream.end(), 1000)
//   }
// }
var co = require('co')
var Methods = {
  testNoResponse: co.wrap(function* (data, meta, getStream) { testCheck = data }),
  testAknowlegment: co.wrap(function* (data, meta, getStream) { testCheck = data }),
  testResponse: co.wrap(function* (data, meta, getStream) {
    yield new Promise((resolve) => setTimeout(resolve, 1000))
    testCheck = data
    return data
  }),
  testStream: co.wrap(function* (data, meta, getStream) {
    CONSOLE.debug('testStream', {data, meta, getStream})
    testCheck = data
    var onClose = () => { CONSOLE.log('stream closed') }
    stream = getStream(onClose, 120000)
    stream.write({testStreamConnnected: 1})
    setTimeout(() => stream.write({testStreamData: 1}), 500)
    setTimeout(() => stream.end(), 1000)
  })
}
co.wrap(function* (data, meta, getStream) { testCheck = data })

var getMethods = (service, exclude) => Methods

var getSharedConfig = (field = 'net', service = '*', exclude = '') => {
  if (service === '*') return Object.keys(sharedConfig).filter((key) => key !== exclude).map((key) => { return {items: sharedConfig[key][field], service: key} })
  else return sharedConfig[service][field]
}

function getServer (serviceName, serviceId) {
  var getMethodsConfig = async (service, exclude) => getSharedConfig('methods', service || serviceName, exclude)
  var getNetConfig = async (service, exclude) => getSharedConfig('net', service || serviceName, exclude)
  var getEventsIn = async (service, exclude) => getSharedConfig('eventsIn', service || serviceName, exclude)
  var getEventsOut = async (service, exclude) => getSharedConfig('eventsOut', service || serviceName, exclude)
  var getRpcOut = async (service, exclude) => getSharedConfig('rpcOut', service || serviceName, exclude)
  return require('../net.server')({getConsole, serviceName, serviceId, getMethods, getMethodsConfig, getNetConfig})
}

function getClient (serviceName, serviceId) {
  var getMethodsConfig = async (service, exclude) => getSharedConfig('methods', service || serviceName, exclude)
  var getNetConfig = async (service, exclude) => getSharedConfig('net', service || serviceName, exclude)
  var getEventsIn = async (service, exclude) => getSharedConfig('eventsIn', service || serviceName, exclude)
  var getEventsOut = async (service, exclude) => getSharedConfig('eventsOut', service || serviceName, exclude)
  var getRpcOut = async (service, exclude) => getSharedConfig('rpcOut', service || serviceName, exclude)
  return require('../net.client')({getConsole, serviceName, serviceId, getNetConfig, getEventsIn, getEventsOut, getMethodsConfig, getRpcOut})
}

var netServer1 = getServer('net1', 'net1')
var netServer2 = getServer('net2', 'net2')
var netServer3 = getServer('net3', 'net3')
var netServer4 = getServer('net4', 'net4')
netServer1.start()
netServer2.start()
netServer3.start()
netServer4.start()

var netClient1 = getClient('net1', 'net1')

t.test('*** NET ***', {
  autoend: true
}, async function mainTest (t) {
  t.plan(5)
  await new Promise((resolve) => setTimeout(resolve, 1000))
  await t.test('netClient1.rpc -> testNoResponse', async function (t) {
    testCheck = false
    var response = await netClient1.rpc('testRpcNoResponse', {'test_data': 1}, meta)
    t.same(response, null, 'response=true on NoResponse')
    await new Promise((resolve) => setTimeout(resolve, 1000))
    t.same(testCheck, {'test_data': 1}, 'testNoResponse richiesta ricevuta')
    t.end()
  })
  await t.test('netClient1.rpc -> testAknowlegment', async function (t) {
    testCheck = false
    var response = await netClient1.rpc('testRpcAknowlegment', {'test_data': 1}, meta)
    t.same(response, null, 'Aknowlegment ok')
    t.same(testCheck, {'test_data': 1}, 'testAknowlegment richiesta ricevuta')
    t.end()
  })
  //
  await t.test('netClient1.rpc -> testResponse', async function (t) {
    testCheck = false
    var response = await netClient1.rpc('testRpcResponse', {'test_data': 1}, meta)
    t.same(response, {'test_data': 1}, 'response as sended')
    t.same(testCheck, {'test_data': 1}, 'testResponse richiesta ricevuta')
    t.end()
  })
  await t.test('netClient1.rpc -> testStream', async function (t) {
    testCheck = false
    var testStream = false
    var streaming = await netClient1.rpc('testRpcStream', {'test_data': 1}, meta)
    streaming.on('data', (data) => { CONSOLE.debug('streaming data', data); testStream = true })
    streaming.on('error', (data) => CONSOLE.debug('streaming error', data))
    streaming.on('end', (data) => CONSOLE.debug('streaming close', data))

    await new Promise((resolve) => setTimeout(resolve, 1000))
    t.same(testStream, true, 'Stream received')
    t.same(testCheck, {'test_data': 1}, 'testStream richiesta ricevuta')
    t.end()
  })

  await t.test('netClient1.emit -> testEmit', async function (t) {
    testCheck = false
    var response = await netClient1.emit('testEvent', {'eventTest_data': 1}, meta)
    t.same(response, {'eventTest_data': 1}, 'response as sended')
    t.same(testCheck, {'eventTest_data': 1}, 'delayed received')
    t.end()
  })

  await new Promise((resolve) => setTimeout(resolve, 1000))
  t.end()
  // process.exit()
}).then(() => process.exit())
