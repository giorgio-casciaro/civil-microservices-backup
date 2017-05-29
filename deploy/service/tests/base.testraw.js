process.on('unhandledRejection', function (reason) {
  console.error('oops', reason)
  process.exit(1)
})

var path = require('path')
var request = require('request-promise-native')

var startTest = async function () {
  process.env.mountPath = path.join(__dirname, '/mount/')
  var config = require('../config')
  var SERVICE = require('../start')
  await new Promise((resolve) => setTimeout(resolve, 1000))

  var microRandom = Math.floor(Math.random() * 100000)
  var mainTest = require('../lib/microTest')('test Microservice local methods and db conenctions', 0)
  var microTest = mainTest.test
  var finishTest = mainTest.finish

  var basicMeta = {}
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

  var analizeDev = await request.get(`http://${config.httpHost}:${config.httpPort}/analizeDev`, { form: {} })
  console.log('analizeDev', analizeDev)
  microTest(JSON.parse(analizeDev), {services: 'object'}, 'analizeDev', TYPE_OF)

  var buildService = await request.get(`http://${config.httpHost}:${config.httpPort}/buildService?service=test`)
  microTest(JSON.parse(buildService), {success: 'string'}, 'buildService build docker, push docker, update kubernetes', TYPE_OF)

  var getUpdatedKubernetesYaml = await request.get(`http://${config.httpHost}:${config.httpPort}/getUpdatedKubernetesYaml?service=test`)
  microTest(JSON.parse(getUpdatedKubernetesYaml), {deployment: 'string'}, 'getUpdatedKubernetesYaml: only deployment or statefulSet yaml', TYPE_OF)

  var getAllKubernetesYaml = await request.get(`http://${config.httpHost}:${config.httpPort}/getAllKubernetesYaml?service=test`)
  microTest(JSON.parse(getAllKubernetesYaml), {'deployment.yaml': 'string'}, 'getAllKubernetesYaml: get all kubernetes configs', TYPE_OF)

  var buildServiceForce = await request.get(`http://${config.httpHost}:${config.httpPort}/buildService?service=test&force=1`)
  microTest(JSON.parse(buildServiceForce), {build: 'object'}, 'buildService Force ', TYPE_OF)

  finishTest()
  SERVICE.server.connection.close()
  await new Promise((resolve) => setTimeout(resolve, 1000))
  process.exit()
}
startTest()
