// var MongoClient = require('mongodb').MongoClient
process.on('unhandledRejection', (err, p) => {
  console.log('An unhandledRejection occurred')
  console.log(`Rejected Promise: ${p}`)
  console.log(`Rejection: ${err}`)
})

const cqrs = require('sint-bit-cqrs')
const path = require('path')
const uuid = require('uuid/v4')
const Aerospike = require('aerospike')
const Key = Aerospike.Key
var kvDb = require('./lib/kvDb')

var service = async function getMethods (CONSOLE, netClient, CONFIG = require('./config')) {
  try {
    CONSOLE.log('CONFIG', CONFIG)
    var kvDbClient = await kvDb.getClient(CONFIG.aerospike)
    await kvDb.createIndex(kvDbClient, {
      ns: CONFIG.aerospike.namespace,
      set: CONFIG.aerospike.set,
      bin: '_updated',
      index: CONFIG.aerospike.set + '_idx_updated',
      datatype: Aerospike.indexDataType.NUMERIC
    })
    await kvDb.createIndex(kvDbClient, {
      ns: CONFIG.aerospike.namespace,
      set: CONFIG.aerospike.set,
      bin: '_created',
      index: CONFIG.aerospike.set + '_idx_created',
      datatype: Aerospike.indexDataType.NUMERIC
    })
  } catch (error) {
    CONSOLE.error('getMethods', error)
    return { error: 'getMethods error' }
  }

  var mutationsPack = require('sint-bit-cqrs/mutations')({ mutationsPath: path.join(__dirname, '/mutations') })
  const mutate = async function (args) {
    try {
      var mutation = mutationsPack.mutate(args)
      CONSOLE.debug('mutate', mutation)
      var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.mutationsSet, mutation.id)
      await kvDb.put(kvDbClient, key, mutation)
      return mutation
    } catch (error) {
      CONSOLE.error('problems during create', error)
      return {error: 'problems during mutate'}
    }
  }
  const getState = async function (objId) {
    try {
      var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.viewsSet, objId)
      var state = await kvDb.get(kvDbClient, key)
      return {state, key}
    } catch (error) {
      CONSOLE.error('problems during getState', error)
      return {error: 'problems during getState'}
    }
  }

  var create = async function (data, meta = {directCall: true}, getStream = null) {
    try {
      CONSOLE.debug(`create`, {data, objId: data.id, mutation: 'create', meta})

      data.id = data.id || uuid() // generate id if necessary

      var mutation = await mutate({data, objId: data.id, mutation: 'create', meta})
      CONSOLE.debug('create mutation', mutation)
      var newState = mutationsPack.applyMutations({}, [mutation])
      CONSOLE.debug('create newState', newState)
      var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.set, data.id)
      kvDb.put(kvDbClient, key, newState).then(() => {})
      netClient.emit('viewCreated', newState, meta)
      return {id: data.id}
    } catch (error) {
      CONSOLE.warn('problems during create', error)
      return {error: 'problems during create'}
    }
  }

  var update = async function (data, meta = {directCall: true}, getStream = null) {
    try {
      CONSOLE.debug(`start update() corrid:` + meta.corrid, {data, meta})
      // await authorize({action: 'write.create', entityName: 'Resource', meta, data, id})
      var mutation = await mutate({data, objId: data.id, mutation: 'update', meta})
      var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.set, data.id)
      kvDb.get(kvDbClient, key).then((state) => {
        var newState = mutationsPack.applyMutations(state, [mutation])
        netClient.emit('viewCreated', newState, meta)
        kvDb.put(kvDbClient, key, newState)
      })
      return {id: data.id}
    } catch (error) {
      CONSOLE.warn('problems during update', error)
      return {error: 'problems during update'}
    }
  }

  var read = async function (data, meta = {directCall: true}, getStream = null) {
    try {
      var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.set, data.id)
      var view = await kvDb.get(kvDbClient, key)
      netClient.emit('viewReaded', { id: data.id}, meta)
      return view
    } catch (error) {
      // CONSOLE.warn('problems during read', error)
      return {error: 'problems during read'}
    }
  }

  var remove = async function (data, meta = {directCall: true}, getStream = null) {
    try {
      var mutation = await mutate({data, objId: data.id, mutation: 'delete', meta})
      var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.set, data.id)
      kvDb.remove(kvDbClient, key).then(() => {
        netClient.emit('viewRemoved', { id: data.id}, meta)
      })
      return { id: data.id }
    } catch (error) {
      CONSOLE.warn('problems during remove', error)
      return {error: 'problems during remove'}
    }
  }

  var queryByTimestamp = async function (query = {from: 0, to: 100000000000000}, meta = {directCall: true}, getStream = null) {
    try {
      var result = await kvDb.query(kvDbClient, CONFIG.aerospike.namespace, CONFIG.aerospike.set, (dbQuery) => {
        dbQuery.where(Aerospike.filter.range('_updated', query.from, query.to))
      })
      return result
    } catch (error) {
      CONSOLE.error('queryByTimestamp', error)
      return { error: 'remove error' }
    }
  }

  return {
    create, read, update, remove, queryByTimestamp
  }
}

module.exports = service
