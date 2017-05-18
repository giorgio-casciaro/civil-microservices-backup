
// var R = require('ramda')
// var deref = require('json-schema-deref-sync')
// var faker = require('faker')
// var jsf = require('json-schema-faker')
// faker.locale = 'it'
// var restler = require('restler')
//
// var request = require('request')
var t = require('tap')
// var path = require('path')

const getConsole = (serviceName, serviceId, pack) => require('../utils').getConsole({error: true, debug: true, log: true, warn: true}, serviceName, serviceId, pack)
var CONSOLE = getConsole('BASE TEST', '----', '-----')

var config = {url: 'localhost:8080', file: '/tmp/test'}
var testCheck = false
var testStream = false
var methodCall = async (data, getStream, isPublic) => {
  CONSOLE.debug('methodCall', data, getStream, isPublic)
  testCheck = true
  if (!getStream) return data
  var stream = getStream(() => console.log('closed'), 120000)
  stream.write({testStreamConnnected: 1})

  setTimeout(() => stream.write({testStreamData: 1}), 500)
  setTimeout(() => stream.end(), 1000)
  testStream = true
}
var testChannels = [ 'httpPublic', 'socket', 'http', 'test']

t.plan(testChannels.length)
var message = {
  method: 'testMEthod',
  data: {'testData': 1},
  meta: {'corrid': 1, 'userid': 1}
}
var mainTest = (testChannel) => t.test('*** ' + testChannel + ' CHANNEL ***', { autoend: true}, async function mainTest (t) {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  var channelServer = require('../channels/' + testChannel + '.server')({getConsole, methodCall, config})
  var channelClient = require('../channels/' + testChannel + '.client')({getConsole})
  channelServer.start()
  await new Promise((resolve) => setTimeout(resolve, 2000))
  t.plan(3)
  await t.test('channelClient.send -> testResponse', async function (t) {
    testCheck = false
    var response = await channelClient.send(config, message, 5000, true, false)
    CONSOLE.debug('testResponse response', response)
    t.same(response.data, message.data, 'response data as sended')
    t.same(testCheck, true, 'testResponse richiesta ricevuta')
    t.end()
  })

  await t.test('channelClient.send -> testNoResponse', async function (t) {
    testCheck = false
    var response = await channelClient.send(config, message, 5000, false, false)
    CONSOLE.debug('testNoResponse response', response)
    t.same(response, null, 'response null')
    await new Promise((resolve) => setTimeout(resolve, 500))
    t.same(testCheck, true, 'testResponse richiesta ricevuta')
    t.end()
  })

  await t.test('channelClient.send -> testStream', async function (t) {
    testCheck = false
    testStream = false
    var testStream2 = false
    var testStream3 = false
    var streaming = await channelClient.send(config, message, 5000, true, true)
    streaming.on('data', (data) => { CONSOLE.debug('streaming data', data); testStream2 = true })
    streaming.on('error', (data) => CONSOLE.debug('streaming error', data))
    streaming.on('end', (data) => { CONSOLE.debug('streaming close', data); testStream3 = true })
    await new Promise((resolve) => setTimeout(resolve, 3000))
    t.same(testStream, true, 'methodCall raggiunto streaming ')
    t.same(testStream2, true, 'testStream2 on data ricevuto')
    t.same(testStream3, true, 'testStream3 on end ricevuto')
    t.same(testCheck, true, 'methodCall avviato ')
    t.end()
  })

  await new Promise((resolve) => setTimeout(resolve, 1000))
  channelServer.stop()
  await new Promise((resolve) => setTimeout(resolve, 1000))
  t.end()
})

Promise.all(testChannels.map(mainTest)).then(() => process.exit())
