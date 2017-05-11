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
    publicName: `sir test_user ${microRandom}. junior`,
    pic: `http://test.com/pic/pic.jpg`,
    email: `test${microRandom}@test${microRandom}.com`,
    password: `t$@es${microRandom}Tt$te1st_com`,
    firstName: `t$@es${microRandom}Tt$te1st_com`,
    lastName: `t$@es${microRandom}Tt$te1st_com`
  }

  microTest(
    await NC('getSchema', {}, basicMeta),
    { schema: 'object' },
    'get all services schema',
    TYPE_OF
  )
  microTest(
    await NC('proxy', {
      service: 'admin',
      method: 'getSchema',
      data: {},
      meta: basicMeta
    }, basicMeta),
    { schema: 'object' },
    'get all services schema through proxy',
    TYPE_OF
  )

  finishTest()
  SERVICE.netServer.stop()
  SERVICE.schemaClient.stop()
  await new Promise((resolve) => setTimeout(resolve, 1000))
  process.exit()
}
startTest()
