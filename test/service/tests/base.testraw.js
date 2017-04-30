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

co(function* () {
  var SERVICE = require('../start')
  var CONFIG = require('../config')
  CONFIG.console.debug = true

  CONFIG.aerospike.set = CONFIG.aerospike.set + '_testSet'
  CONFIG.aerospike.mutationsSet = CONFIG.aerospike.mutationsSet + '_testSet'
  CONFIG.aerospike.viewsSet = CONFIG.aerospike.viewsSet + '_testSet'

  var aerospikeClient = yield getAerospikeClient(CONFIG.aerospike)
  aerospikeClient.truncate(CONFIG.aerospike.namespace, CONFIG.aerospike.set, (err, result) => console.log)
  aerospikeClient.truncate(CONFIG.aerospike.namespace, CONFIG.aerospike.mutationsSet, (err, result) => console.log)
  aerospikeClient.truncate(CONFIG.aerospike.namespace, CONFIG.aerospike.viewsSet, (err, result) => console.log)

  CONFIG.elasticsearch.index = CONFIG.elasticsearch.index + '-test-index'
  var elasticsearchClient = yield getElasticsearchClient(CONFIG.elasticsearch)

  var methods = yield require('../methods')(SERVICE.CONFIG.CONSOLE, SERVICE.netClient, CONFIG)

  var test = require('../lib/microTest')('test Microservice')
  yield new Promise((resolve) => setTimeout(resolve, 1000))

    // CREATE
  var createResponse = yield methods.create({username: 'test_user', email: 'test@test.com', id: 'test'}, {})
  test(createResponse, { id: 'test' }, 'create 1 item')

    // READ
  var readResponse = yield methods.read({id: 'test'})
  test(readResponse.username, 'test_user', 'read 1 item')

    // UPDATE
  yield methods.update({id: 'test', username: 'test_user2'})
  var updateResponse = yield methods.read({id: 'test'})
  test(updateResponse.username, 'test_user2', 'update 1 item')

    // DELETE
  yield methods.remove({id: 'test'})
  var deleteResponse = yield methods.read({id: 'test'})
  test(deleteResponse, {error: 'read error'}, 'remove 1 item')

    // // QUERY

  yield methods.create({username: 'test_user1', email: 'test@test.com', id: 'test1'})
  yield methods.create({username: 'test_user2', email: 'test@test.com', id: 'test2'})
  yield new Promise((resolve) => setTimeout(resolve, 1000))
  var testTimestamp = Date.now()
  yield methods.create({username: 'test_user3', email: 'test@test.com', id: 'test3'})
  yield methods.create({username: 'test_user4', email: 'test@test.com', id: 'test4'})
  yield methods.create({username: 'test_user5', email: 'test@test.com', id: 'test5'})

  var queryResponse = yield methods.queryByTimestamp()
  test(queryResponse.length, 5, 'insert and query 5 items')

  var queryResponse = yield methods.queryByTimestamp({from: testTimestamp, to: Date.now()})
  test(queryResponse.length, 3, 'query by timestamp')

  yield methods.remove({id: 'test1'})
  yield methods.remove({id: 'test2'})
  yield methods.remove({id: 'test3'})
  yield methods.remove({id: 'test4'})
  yield methods.remove({id: 'test5'})

  var queryResponse = yield methods.queryByTimestamp()
  test(queryResponse.length, 0, 'remove 5 items')

    // CREATE CQRS
  var createCqrsResponse = yield methods.createCqrs({username: 'test_user', email: 'test@test.com', id: 'test'}, {})
  test(createCqrsResponse, { id: 'test' }, 'Cqrs create 1 item')

    // READ CQRS
  var readCqrsResponse = yield methods.readCqrs({id: 'test'})
  test(readResponse.username, 'test_user', 'Cqrs read 1 item')

    // UPDATE CQRS
  yield methods.updateCqrs({username: 'test_user2', id: 'test'}, {})
  var updateCqrsResponse = yield methods.readCqrs({id: 'test'})
  test(updateResponse.username, 'test_user2', 'Cqrs update 1 item')

    // DELETE CQRS
  yield methods.removeCqrs({id: 'test'})
  var deleteCqrsResponse = yield methods.readCqrs({id: 'test'})
  test(typeof deleteCqrsResponse.error, 'string', 'Cqrs remove 1 item')

    // CREATE VIEW
  var createViewResponse = yield methods.createView({username: 'test_user', email: 'test@test.com', id: 'test'}, {})
  test(createViewResponse, { id: 'test' }, 'View create 1 item')

  yield new Promise((resolve) => setTimeout(resolve, 1000))

    // READ VIEW
  var readViewResponse = yield methods.readView({id: 'test'})
  test(readResponse.username, 'test_user', 'View read 1 item')

  yield new Promise((resolve) => setTimeout(resolve, 1000))

    // UPDATE VIEW
  yield methods.updateView({username: 'test_user2', id: 'test'}, {})
  var updateViewResponse = yield methods.readView({id: 'test'})
  test(updateResponse.username, 'test_user2', 'View update 1 item')

  yield new Promise((resolve) => setTimeout(resolve, 1000))

    // DELETE VIEW
  yield methods.removeView({id: 'test'})
  yield new Promise((resolve) => setTimeout(resolve, 1000))
  var deleteViewResponse = yield methods.readView({id: 'test'})
  test(typeof deleteViewResponse, 'object', 'View remove 1 item')

  SERVICE.netServer.stop()
  yield new Promise((resolve) => setTimeout(resolve, 1000))
  process.exit()
})
