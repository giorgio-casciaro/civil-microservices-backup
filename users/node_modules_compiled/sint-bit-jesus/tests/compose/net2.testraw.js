var testName = 'COMPOSE SERVER net1'
var path = require('path')

const getConsole = (serviceName, serviceId, pack) => require('../../utils').getConsole({error: true, debug: true, log: true, warn: true}, serviceName, serviceId, pack)
var CONSOLE = getConsole(testName, '----', '-----')

var co = require('co')

var Methods = {}

var stubs = require('../stubs')(require('./sharedConfig'), Methods, getConsole)
// var netServer1 = stubs.getServer('net1', 'net1')
// netServer1.start()
var netClient1 = stubs.getClient('net2', 'net2')
var testChannels = [ 'httpPublic', 'http', 'socket']
async function mainTest () {
  try {
    var meta = {}
    for (var channel of testChannels) {
      var microTest = require('../microTest')(testName + ' ' + channel)
      var timeout = 1000
      var response = await netClient1.rpc('testRpcNoResponse', {'test_data': 1}, meta, timeout, channel)
      CONSOLE.debug('testRpcAknowlegment response', response)
      microTest(response, null, channel + ' response=null on NoResponse')

      response = await netClient1.rpc('testRpcAknowlegment', {'test_data': 1}, meta, timeout, channel)
      CONSOLE.debug('testRpcAknowlegment response', response)
      microTest(response, { aknowlegment: 1 }, channel + ' response={ aknowlegment: 1 } on testRpcAknowlegment')

      response = await netClient1.rpc('testRpcResponse', {'test_data': 1}, meta, timeout, channel)
      CONSOLE.debug('testRpcResponse response', response)
      microTest(response, {'test_data': 1}, channel + ' response as sended on testRpcResponse')

      var streaming = await netClient1.rpc('testRpcStream', {'test_data': 1}, meta, timeout, channel)
      var streamData = []
      CONSOLE.debug('testRpcStream streaming', streaming)
      streaming.on('data', (data) => streamData.push(data))
      streaming.on('error', (data) => CONSOLE.debug('streaming error', data))
      streaming.on('end', (data) => CONSOLE.debug('streaming close', data))
      await new Promise((resolve) => setTimeout(resolve, 1000))

      microTest(streamData, [{testStreamConnnected: 1}, {'test_data': 1}], channel + ' streamData responses as sended on testRpcStream')

      response = await netClient1.emit('testEvent', {'eventTest_data': 1}, meta, timeout, channel)
      microTest(response, {'eventTest_data': 1}, channel + ' response as sended')
    }
  } catch (error) {
    CONSOLE.debug('TEST ERRORS', error)
    microTest(true, false, 'TEST ERRORS')
  }
  await new Promise((resolve) => setTimeout(resolve, 100000))
}
mainTest()
