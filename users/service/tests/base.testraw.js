process.on('unhandledRejection', function (reason) {
  console.error('oops', reason)
  process.exit(1)
})

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

var startTest = async function () {
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

  var methods = await require('../methods')(SERVICE.CONFIG.CONSOLE, SERVICE.netClient, CONFIG)

  var test = require('../lib/microTest')('test Microservice local methods and db conenctions')
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // CREATE CQRS
  var createResponse = await methods.create({username: 'test_user', email: 'test@test.com', id: 'test'}, {})
  test(createResponse, { id: 'test' }, ' create 1 item')

    // READ CQRS
  var readResponse = await methods.read({id: 'test'})
  test(readResponse.username, 'test_user', ' read 1 item')

    // UPDATE CQRS
  await methods.update({username: 'test_user2', id: 'test'}, {})
  var updateResponse = await methods.read({id: 'test'})
  test(updateResponse.username, 'test_user2', ' update 1 item')

    // DELETE CQRS
  await methods.remove({id: 'test'})
  var deleteResponse = await methods.read({id: 'test'})
  test(typeof deleteResponse.error, 'string', ' remove and istant read 1 item')

  // QUERY
  await methods.create({username: 'test_user1', email: 'test@test.com', id: 'test1'})
  await methods.create({username: 'test_user2', email: 'test@test.com', id: 'test2'})
  await new Promise((resolve) => setTimeout(resolve, 1000))
  var testTimestamp = Date.now()
  await methods.create({username: 'test_user3', email: 'test@test.com', id: 'test3'})
  await methods.create({username: 'test_user4', email: 'test@test.com', id: 'test4'})
  await methods.create({username: 'test_user5', email: 'test@test.com', id: 'test5'})

  var queryResponse = await methods.queryByTimestamp()
  test(queryResponse.length, 5, 'insert and query 5 items')

  var queryResponse = await methods.queryByTimestamp({from: testTimestamp, to: Date.now()})
  test(queryResponse.length, 3, 'query by timestamp')

  SERVICE.netServer.stop()
  SERVICE.schemaClient.stop()
  await new Promise((resolve) => setTimeout(resolve, 1000))
  process.exit()
}
startTest()
