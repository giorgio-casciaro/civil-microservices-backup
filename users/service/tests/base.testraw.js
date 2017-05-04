process.on('unhandledRejection', function (reason) {
  console.error('oops', reason)
  process.exit(1)
})

var path = require('path')
var kvDb = require('../lib/kvDb')

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
  // TEST MODIFICATIONS
  process.env.aerospikeSet = 'users_test_set'
  process.env.aerospikeMutationsSet = 'users_test_set'
  process.env.aerospikeViewsSet = 'users_test_set'
  process.env.consoleDebug = true

  var CONFIG = require('../config')
  var SERVICE = require('../start')

  // PREPARE DB
  var kvDbClient = await kvDb.getClient(CONFIG.aerospike)
  // await kvDb.removeSet(kvDbClient, { ns: CONFIG.aerospike.namespace, set: CONFIG.aerospike.set })
  // await kvDb.removeSet(kvDbClient, { ns: CONFIG.aerospike.namespace, set: CONFIG.aerospike.mutationsSet })
  // await kvDb.removeSet(kvDbClient, { ns: CONFIG.aerospike.namespace, set: CONFIG.aerospike.viewsSet })

  // PREPARE DB
  var netClient = SERVICE.netClient
  var microRandom = Math.floor(Math.random() * 100000)
  var microTest = require('../lib/microTest')('test Microservice local methods and db conenctions')
  await new Promise((resolve) => setTimeout(resolve, 1000))

  var basicUser = {
    username: `test_user_${microRandom}`,
    email: `test${microRandom}@test${microRandom}.com`,
    password: `t$@es${microRandom}Tt$te1st_com`,
    confirm: `tes${microRandom}Ttt$e1st_com`
  }
  var basicMeta = {}

  var wrongPasswordReq = Object.assign({}, basicUser, {
    password: `${microRandom}`,
    confirm: `${microRandom}`
  })
  var wrongPasswordResponse = await netClient.testLocalMethod('create', wrongPasswordReq, basicMeta)
  microTest(typeof wrongPasswordResponse.error, 'string', 'wrong request: password not valid')

  var createResponse = await netClient.testLocalMethod('create', basicUser, basicMeta)
  microTest(createResponse, { success: 'User created' }, 'User Create')

  var wrongRecreateResponse = await netClient.testLocalMethod('create', basicUser, basicMeta)
  microTest(typeof wrongRecreateResponse.error, 'string', 'wrong request: User exists')

  var readResponse = await netClient.testLocalMethod('read', basicUser, basicMeta)
  microTest(readResponse, basicUser, 'read', 'fields')

  var reqUserUpdate = { username: `test_user_${microRandom}`, email: `test${microRandom}@test${microRandom}.com` }
  var updateResponse = await netClient.testLocalMethod('update', reqUserUpdate, basicMeta)
  microTest(updateResponse, {success: 'User updated'}, 'update email')
  var readResponse_2 = await netClient.testLocalMethod('read', basicUser, basicMeta)
  microTest(readResponse_2, reqUserUpdate, 'read updated email', 'fields')

  var removeResponse = await netClient.testLocalMethod('remove', { username: `test_user_${microRandom}` }, basicMeta)
  microTest(removeResponse, {success: 'User removed'}, 'remove')
  var readResponse_3 = await netClient.testLocalMethod('read', { username: `test_user_${microRandom}` }, basicMeta)
  microTest(readResponse_3, {status: 0}, 'removed user - status 0 ', 'fields')

  var rpcCreateUserN = (n) => netClient.testLocalMethod('create', Object.assign({}, basicUser, {username: n + '_' + basicUser.username, email: n + '_' + basicUser.email}), basicMeta)

  var testTimestamp1 = Date.now()
  await rpcCreateUserN(1)
  await rpcCreateUserN(2)
  await rpcCreateUserN(3)
  var testTimestamp2 = Date.now()
  await rpcCreateUserN(4)
  await rpcCreateUserN(5)
  await rpcCreateUserN(6)

  var queryResponse = await netClient.testLocalMethod('queryByTimestamp', {from: testTimestamp1}, basicMeta)
  microTest(queryResponse.length, 6, 'queryResponse insert and query 6 items from testTimestamp1')
  var queryResponse2 = await netClient.testLocalMethod('queryByTimestamp', {from: testTimestamp2}, basicMeta)
  microTest(queryResponse2.length, 3, 'queryResponse insert and query 3 items  from testTimestamp2')


  SERVICE.netServer.stop()
  SERVICE.schemaClient.stop()
  await new Promise((resolve) => setTimeout(resolve, 1000))
  process.exit()
}
startTest()
