process.on('unhandledRejection', function (reason) {
  console.error('oops', reason)
  process.exit(1)
})

var path = require('path')

var startTest = async function () {
  var CONFIG = require('../config')
  var SERVICE = require('../start')

  var netClient = SERVICE.netClient
  var basicMeta = {}

  // TEST FUNCTIONS
  const TYPE_OF = (actual, expected) => {
    var filtered = {}
    Object.keys(expected).forEach((key) => { filtered[key] = typeof actual[key] })
    return filtered
  }
  const FILTER_BY_KEYS = (actual, expected) => {
    var filtered = {}
    Object.keys(expected).forEach((key) => { filtered[key] = actual[key] })
    return filtered
  }
  const COUNT = (actual, expected) => actual.length

  var mainTest = require('../lib/microTest')('test Microservice local methods and db conenctions')
  var microTest = mainTest.test
  var finishTest = mainTest.finish

  const NC = netClient.testLocalMethod

  var microRandom = Math.floor(Math.random() * 100000)
  var fields = {

  }

  microTest(
      await NC('analizeDev', {}, basicMeta),
      { schema: 'object' },
      'get all services schema',
      TYPE_OF
    )
  // microTest(
  //       await NC('getPublicApiSchema', {}, basicMeta),
  //       { publicSchema: 'object' },
  //       'get Public Api Schema schema',
  //       TYPE_OF,
  //       2
  //     )
  // microTest(
  //   await NC('proxy', {
  //     service: 'deploy',
  //     method: 'getSchema',
  //     data: {},
  //     meta: basicMeta
  //   }, basicMeta),
  //   { schema: 'object' },
  //   'get all services schema through proxy',
  //   TYPE_OF
  // )

  finishTest()
  SERVICE.netServer.stop()
  // SERVICE.schemaClient.stop()
  await new Promise((resolve) => setTimeout(resolve, 1000))
  process.exit()
}
startTest()
