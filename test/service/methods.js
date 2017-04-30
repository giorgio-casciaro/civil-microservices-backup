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

console.log(kvDb)
var elasticsearch = require('elasticsearch')

var co = require('co')

// Connection URL
// Use connect method to connect to the Server

var service = co.wrap(function* getMethods (CONSOLE, netClient, CONFIG = require('./config')) {
  // var getMongo = () => toPromise(MongoClient.connect, [url], MongoClient)

  try {
    CONSOLE.log('CONFIG', CONFIG)
    var kvDbClient = yield kvDb.getClient(CONFIG.aerospike)
    yield kvDb.createIndex(kvDbClient, {
      ns: CONFIG.aerospike.namespace,
      set: CONFIG.aerospike.set,
      bin: '_updated',
      index: CONFIG.aerospike.set + '_idx_updated',
      datatype: Aerospike.indexDataType.NUMERIC
    })
    yield kvDb.createIndex(kvDbClient, {
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

  var create = co.wrap(function* (data, meta = {directCall: true}, getStream = null) {
    try {
      CONSOLE.log('create', data, meta)
      if (!data.id)data.id = uuid()
      data._created = data._updated = Date.now()
      var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.set, data.id)
      var result = yield kvDb.put(kvDbClient, key, data, meta)
      CONSOLE.debug('create', result)
      return { id: result.key }
    } catch (error) {
      CONSOLE.error('create', error)
      return { error: 'create error' }
    }
  })
  var read = co.wrap(function* (data, meta = {directCall: true}, getStream = null) {
    try {
      var result = yield kvDb.get(kvDbClient, new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.set, data.id))
      CONSOLE.debug('read', result)
      return result.result
    } catch (error) {
      // CONSOLE.error('read', error)
      return { error: 'read error' }
    }
  })
  var update = co.wrap(function* (data, meta = {directCall: true}, getStream = null) {
    try {
      var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.set, data.id)
      var readResult = yield kvDb.get(kvDbClient, key)
      CONSOLE.debug('readResult', readResult)
      var updatedData = Object.assign(readResult.result, data)
      var writeResult = yield kvDb.put(kvDbClient, key, updatedData, readResult.meta)
      CONSOLE.debug('writeResult', writeResult)
      return { id: writeResult.key }
    } catch (error) {
      CONSOLE.error('update', error)
      return { error: 'update error' }
    }
  })
  var remove = co.wrap(function* (data, meta = {directCall: true}, getStream = null) {
    try {
      CONSOLE.debug('remove', CONFIG.aerospike.namespace, CONFIG.aerospike.set, data.id)
      var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.set, data.id)
      var result = yield kvDb.remove(kvDbClient, key)
      CONSOLE.debug('remove', key)
      return { id: data.id }
    } catch (error) {
      CONSOLE.error('remove', error)
      return { error: 'remove error' }
    }
  })
  var queryByTimestamp = co.wrap(function* (query = {from: 0, to: 100000000000000}, meta = {directCall: true}, getStream = null) {
    try {
      var result = yield kvDb.query(kvDbClient, CONFIG.aerospike.namespace, CONFIG.aerospike.set, (dbQuery) => {
        dbQuery.where(Aerospike.filter.range('_updated', query.from, query.to))
      })
      return result
    } catch (error) {
      CONSOLE.error('queryByTimestamp', error)
      return { error: 'remove error' }
    }
  })

  // CQRS

  // const getObjMutations = ({entityName, objId, minTimestamp = 0}) => getStorage().find({ collectionName: entityName + 'Mutations', query: { objId, timestamp: {$gte: minTimestamp} }, sort: {timestamp: 1} }) // ASYNC
  // const getLastSnapshot = ({entityName, objId}) => getStorage().find({collectionName: entityName + 'MainViewSnapshots', query: {objId: objId}, sort: {timestamp: 1}, limit: 1, start: 0})// ASYNC
  var mutationsCqrsPack = require('sint-bit-cqrs/mutations')({ mutationsPath: path.join(__dirname, '/mutations') })
  // var viewsCqrsPack = require('sint-bit-cqrs/views')({snapshotsMaxMutations: CONFIG.snapshotsMaxMutations })

  // const refreshViews = co.wrap(function*(args) {
  //   var results = yield viewsCqrsPack.refreshViews(args)
  //   var views = []
  //   // results.forEach(({updatedView, newSnapshot}) => {
  //   //   if (updatedView) {
  //   //     views.push(updatedView)
  //   //     storageUpdate(entityCONFIG.viewsCollection, updatedView)
  //   //   }
  //   //   if (newSnapshot)storageInsert(entityCONFIG.snapshotsCollection, newSnapshot)
  //   // })
  //   return views
  // })
  const mutate = co.wrap(function*(args) {
    try {
      var mutation = mutationsCqrsPack.mutate(args)
      CONSOLE.debug('mutate', mutation)
      var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.mutationsSet, mutation.id)
      yield kvDb.put(kvDbClient, key, mutation)
      return mutation
    } catch (error) {
      CONSOLE.error('problems during create', error)
      return {error: 'problems during mutate'}
    }
  })
  const getState = co.wrap(function*(objId) {
    try {
      var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.viewsSet, objId)
      var state = yield kvDb.get(kvDbClient, key)
      return {state, key}
    } catch (error) {
      CONSOLE.error('problems during getState', error)
      return {error: 'problems during getState'}
    }
  })

  var createCqrs = co.wrap(function* (data, meta = {directCall: true}, getStream = null) {
    try {
      CONSOLE.debug(`createCqrs`, {data, objId: data.id, mutation: 'create', meta})
      // CONSOLE.debug(`start createResource() corrid:` + meta.corrid, {data, meta})
      // yield authorize({action: 'write.create', entityName: 'Resource', meta, data, id})

      data.id = data.id || uuidV4() // generate id if necessary

      var mutation = yield mutate({data, objId: data.id, mutation: 'create', meta})
      CONSOLE.debug('createCqrs mutation', mutation)
      var newState = mutationsCqrsPack.applyMutations({}, [mutation])
      CONSOLE.debug('createCqrs newState', newState)
      var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.set, data.id)
      kvDb.put(kvDbClient, key, newState).then(() => {})
      netClient.emit('viewCreated', newState, meta)
      return {id: data.id}
    } catch (error) {
      CONSOLE.warn('problems during createCqrs', error)
      return {error: 'problems during createCqrs'}
    }
  })

  var updateCqrs = co.wrap(function* (data, meta = {directCall: true}, getStream = null) {
    try {
      CONSOLE.debug(`start updateCqrs() corrid:` + meta.corrid, {data, meta})
      // yield authorize({action: 'write.create', entityName: 'Resource', meta, data, id})
      var mutation = yield mutate({data, objId: data.id, mutation: 'update', meta})
      var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.set, data.id)
      kvDb.get(kvDbClient, key).then((state) => {
        var newState = mutationsCqrsPack.applyMutations(state, [mutation])
        netClient.emit('viewCreated', newState, meta)
        kvDb.put(kvDbClient, key, newState)
      })
      return {id: data.id}
    } catch (error) {
      CONSOLE.warn('problems during updateCqrs', error)
      return {error: 'problems during updateCqrs'}
    }
  })

  var readCqrs = co.wrap(function* (data, meta = {directCall: true}, getStream = null) {
    try {
      var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.set, data.id)
      var view = yield kvDb.get(kvDbClient, key)
      netClient.emit('viewReaded', { id: data.id}, meta)
      return view
    } catch (error) {
      // CONSOLE.warn('problems during readCqrs', error)
      return {error: 'problems during readCqrs'}
    }
  })
  var removeCqrs = co.wrap(function* (data, meta = {directCall: true}, getStream = null) {
    try {
      var mutation = yield mutate({data, objId: data.id, mutation: 'delete', meta})
      var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.set, data.id)
      kvDb.remove(kvDbClient, key).then(() => {
        netClient.emit('viewRemoved', { id: data.id}, meta)
      })
      return { id: data.id }
    } catch (error) {
      CONSOLE.warn('problems during removeCqrs', error)
      return {error: 'problems during removeCqrs'}
    }
  })

  var elasticsearch = require('elasticsearch')
  var eClient = new elasticsearch.Client(Object.assign({}, CONFIG.elasticsearch))
  // var pingResponse = yield eClient.ping({
  //   requestTimeout: 10000
  // })
  // t.same(pingResponse, true, 'elasticsearch ping')
  // var searchResponse = yield eClient.search({
  //   q: 'test'
  // })
  //

  // EMIT
  var emit = co.wrap(function* (data, meta = {directCall: true}, getStream = null) {
    try {
      return yield netClient.emit('viewCreated', data.data, data.meta)
    } catch (error) {
      CONSOLE.warn('problems during emit', error)
      return {error: 'problems during emit'}
    }
  })
  // VIEW
  var createView = co.wrap(function* (data, meta = {directCall: true}, getStream = null) {
    try {
      CONSOLE.debug(`start createView() corrid:` + meta.corrid, {data, meta})
      data.id = data.id || uuidV4() // generate id if necessary
      var response = yield eClient.index({
        index: CONFIG.elasticsearch.index,
        type: CONFIG.elasticsearch.type,
        id: data.id,
        body: data
      })
      CONSOLE.debug('createView response', response)
      // netClient.emit('viewCreated', newState, meta)
      return {id: data.id}
    } catch (error) {
      CONSOLE.warn('problems during createView', error)
      return {error: 'problems during createView'}
    }
  })
  var readView = co.wrap(function* (data, meta = {directCall: true}, getStream = null) {
    try {
      CONSOLE.debug(`start readView() corrid:` + meta.corrid, {data, meta})
      data.id = data.id || uuidV4() // generate id if necessary
      var response = yield eClient.get({
        index: CONFIG.elasticsearch.index,
        type: CONFIG.elasticsearch.type,
        id: data.id
      })
      CONSOLE.debug('readView response', response)
      return response
    } catch (error) {
      // CONSOLE.warn('problems during readView', error)
      return {error: 'problems during readView'}
    }
  })
  var updateView = co.wrap(function* (data, meta = {directCall: true}, getStream = null) {
    try {
      CONSOLE.debug(`start updateView() corrid:` + meta.corrid, {data, meta})
      data.id = data.id || uuidV4() // generate id if necessary
      var response = yield eClient.update({
        index: CONFIG.elasticsearch.index,
        type: CONFIG.elasticsearch.type,
        id: data.id,
        body: {
          doc: data
        }
      })
      CONSOLE.debug('updateView response', response)
      return {id: data.id}
    } catch (error) {
      CONSOLE.warn('problems during updateView', error)
      return {error: 'problems during updateView'}
    }
  })
  var removeView = co.wrap(function* (data, meta = {directCall: true}, getStream = null) {
    try {
      CONSOLE.debug(`start removeView() corrid:` + meta.corrid, {data, meta})
      data.id = data.id || uuidV4() // generate id if necessary
      var response = yield eClient.delete({
        index: CONFIG.elasticsearch.index,
        type: CONFIG.elasticsearch.type,
        id: data.id
      })
      CONSOLE.debug('removeView response', response)
      return {id: data.id}
    } catch (error) {
      CONSOLE.warn('problems during removeView', error)
      return {error: 'problems during removeView'}
    }
  })

  return {
    emit,
    create, read, update, remove, queryByTimestamp,
    createCqrs, readCqrs, updateCqrs, removeCqrs,
    createView, readView, updateView, removeView
  }
})

module.exports = service
