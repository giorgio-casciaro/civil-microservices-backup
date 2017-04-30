var co = require('co')
var path = require('path')

const Aerospike = require('aerospike')
function getKvDbClient (config) {
  return new Promise((resolve, reject) => {
    Aerospike.connect(config, (error, client) => {
      if (error) return reject(error)
      resolve(client)
    })
  })
}
function getAerospikeClient (config) {
  return new Promise((resolve, reject) => {
    getKvDbClient(config).then((client) => {
      console.log('getAerospikeClient CONNECTED')
      resolve(client)
    }).catch((error) => {
      require('dns').lookup('aerospike', (err, address, family) => {
        console.log('address: %j family: IPv%s', address, family)
      })
      console.log('getAerospikeClient NOT CONNECTED')
      setTimeout(getAerospikeClient, 1000)
    })
  })
}
var getElasticsearchClient = co.wrap(function* (config) {
  var elasticsearch = require('elasticsearch')
  var configClone = Object.assign({}, config)
  var eClient = new elasticsearch.Client(configClone)
  var pingResponse = yield eClient.ping({ requestTimeout: 10000 })
  return eClient
})

var startTest = async function () {
  try {
    var SERVICE = require('../start')
    var CONFIG = require('../config')
    CONFIG.console.debug = true

    CONFIG.aerospike.set = CONFIG.aerospike.set + '_testSet'
    CONFIG.aerospike.mutationsSet = CONFIG.aerospike.mutationsSet + '_testSet'
    CONFIG.aerospike.viewsSet = CONFIG.aerospike.viewsSet + '_testSet'

    var aerospikeClient = await getAerospikeClient(CONFIG.aerospike)
    aerospikeClient.truncate(CONFIG.aerospike.namespace, CONFIG.aerospike.set, (err, result) => console.log)
    aerospikeClient.truncate(CONFIG.aerospike.namespace, CONFIG.aerospike.mutationsSet, (err, result) => console.log)
    aerospikeClient.truncate(CONFIG.aerospike.namespace, CONFIG.aerospike.viewsSet, (err, result) => console.log)

    CONFIG.elasticsearch.index = CONFIG.elasticsearch.index + '-test-index'
    var elasticsearchClient = await getElasticsearchClient(CONFIG.elasticsearch)

    var methods = await require('../methods')(SERVICE.CONFIG.CONSOLE, SERVICE.netClient, CONFIG)

    var test = require('../lib/microTest')('testEvents Microservice')
    var createViewResponse = await SERVICE.netClient.rpc('testRpc', {username: 'view_test_user', email: 'view_test@test.com', id: 'view_test'})

    test(createViewResponse, { id: 'view_test' }, 'View create 1 item')

    var createViewResponse = await SERVICE.netClient.rpc('testRpc', {username: 'view_test_user', email: 'view_test@test.com', id: 'view_test'})
    test(createViewResponse, { id: 'view_test' }, 'View create 1 item')

    SERVICE.netServer.stop()
    await new Promise((resolve) => setTimeout(resolve, 1000))
  } catch (e) {
    console.error(e)
    test(true, false, e)
  }
  process.exit()
}
startTest()
