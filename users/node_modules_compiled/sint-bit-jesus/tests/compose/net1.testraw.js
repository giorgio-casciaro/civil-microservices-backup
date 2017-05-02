process.on('unhandledRejection', function (reason, p) {
  console.error('Possibly Unhandled Rejection at: Promise ', p, ' reason: ', reason)
    // application specific logging here
})

var testName = 'COMPOSE SERVER net1'
var path = require('path')
var microTest = require('../microTest')(testName)

const getConsole = (serviceName, serviceId, pack) => require('../../utils').getConsole({error: true, debug: true, log: true, warn: true}, serviceName, serviceId, pack)
var CONSOLE = getConsole(testName, '----', '-----')

var co = require('co')

var Methods = {
  testNoResponse: co.wrap(function* (data, meta, getStream) {
    CONSOLE.debug('testNoResponse', {data, meta, getStream})
  }),
  testAknowlegment: co.wrap(function* (data, meta, getStream) {
    CONSOLE.debug('testAknowlegment', {data, meta, getStream})
  }),
  testResponse: co.wrap(function* (data, meta, getStream) {
    CONSOLE.debug('testResponse', {data, meta, getStream})
    yield new Promise((resolve) => setTimeout(resolve, 1000))
    return data
  }),
  testStream: co.wrap(function* (data, meta, getStream) {
    CONSOLE.debug('testStream', {data, meta, getStream})
    var onClose = () => { CONSOLE.log('stream closed') }
    var stream = getStream(onClose, 120000)
    stream.write({testStreamConnnected: 1})
    setTimeout(() => stream.write(data), 500)
    setTimeout(() => stream.end(), 1000)
  })
}

var stubs = require('../stubs')(require('./sharedConfig'), Methods, getConsole)
var netServer1 = stubs.getServer('net1', 'net1')

async function mainTest () {
  console.info('starting server...')
  await netServer1.start()
  console.info('server started...')
//  microTest(typeof response, 'object', 'response is object')
}
mainTest()
