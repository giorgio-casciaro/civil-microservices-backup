// var MongoClient = require('mongodb').MongoClient
process.on('unhandledRejection', (err, p) => {
  console.log('An unhandledRejection occurred')
  console.log(`Rejected Promise: ${p}`)
  console.log(`Rejection: ${err}`)
})

const path = require('path')
const Aerospike = require('aerospike')
const Key = Aerospike.Key
var kvDb = require('./lib/kvDb')

var service = async function getMethods (CONSOLE, netClient, CONFIG = require('./config')) {
  try {
    CONSOLE.debug('CONFIG', CONFIG)
    var kvDbClient = await kvDb.getClient(CONFIG.aerospike)

    var mutationsPack = require('sint-bit-cqrs/mutations')({ mutationsPath: path.join(__dirname, '/mutations') })
    const mutate = async function (args) {
      try {
        var mutation = mutationsPack.mutate(args)
        CONSOLE.debug('mutate', mutation)
        var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.mutationsSet, mutation.id)
        await kvDb.put(kvDbClient, key, mutation)
        return mutation
      } catch (error) {
        throw new Error('problems during mutate')
      }
    }
    var initViewsInited = false
    const initViews = async function () {
      try {
        if (initViewsInited) return false
        initViewsInited = true
        await kvDb.createIndex(kvDbClient, { ns: CONFIG.aerospike.namespace, set: CONFIG.aerospike.set, bin: 'updated', index: CONFIG.aerospike.set + '_updated', datatype: Aerospike.indexDataType.NUMERIC })
        await kvDb.createIndex(kvDbClient, { ns: CONFIG.aerospike.namespace, set: CONFIG.aerospike.set, bin: 'created', index: CONFIG.aerospike.set + '_created', datatype: Aerospike.indexDataType.NUMERIC })
      } catch (error) {
        throw new Error('problems during initViews')
      }
    }
    const updateView = async function (id, mutations, isNew) {
      try {
        initViews()
        var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.set, id)
        var view = await getView(id, false) || {state: {}}
        view.updated = Date.now()
        if (!view.created)view.created = Date.now()
        view.state = JSON.stringify(mutationsPack.applyMutations(view.state, mutations))
        await kvDb.put(kvDbClient, key, view)
        return view
      } catch (error) {
        throw new Error('problems during updateView')
      }
    }
    const getView = async function (id, stateOnly = true) {
      try {
        var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.set, id)
        var view = await kvDb.get(kvDbClient, key)
        if (!view) return null
        if (view.state)view.state = JSON.parse(view.state)
        if (stateOnly) return view.state
        return view
      } catch (error) {
        throw new Error('problems during getView')
      }
    }

    var create = async function (data, meta = {directCall: true}, getStream = null) {
      try {
        var id = data.username
        var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.set, id)
        var currentState = await kvDb.get(kvDbClient, key)
        if (currentState) throw new Error('User exists')
        var mutation = await mutate({data, objId: id, mutation: 'create', meta})
        updateView(id, [mutation], true)
        return {success: `User created`}
      } catch (error) {
        return {error: JSON.stringify({'type': 'method', method: 'create', 'error': error.message})}
      }
    }

    var read = async function (data, meta = {directCall: true}, getStream = null) {
      try {
        var id = data.username
        var currentState = await getView(id)
        return currentState
      } catch (error) {
        return {error: JSON.stringify({'type': 'method', method: 'read', 'error': error.message})}
      }
    }

    var update = async function (data, meta = {directCall: true}, getStream = null) {
      try {
        var id = data.username
        var mutation = await mutate({data, objId: id, mutation: 'update', meta})
        updateView(id, [mutation])
        return {success: `User updated`}
      } catch (error) {
        return {error: JSON.stringify({'type': 'method', method: 'update', 'error': error.message})}
      }
    }

    var remove = async function (data, meta = {directCall: true}, getStream = null) {
      try {
        var id = data.username
        var mutation = await mutate({data, objId: id, mutation: 'delete', meta})
        updateView(id, [mutation])
        return {success: `User removed`}
      } catch (error) {
        return {error: JSON.stringify({'type': 'method', method: 'remove', 'error': error.message})}
      }
    }

    var queryByTimestamp = async function (query = {}, meta = {directCall: true}, getStream = null) {
      try {
        query = Object.assign({from: 0, to: 100000000000000}, query)
        var result = await kvDb.query(kvDbClient, CONFIG.aerospike.namespace, CONFIG.aerospike.set, (dbQuery) => {
          dbQuery.where(Aerospike.filter.range('updated', query.from, query.to))
        })
        return result
      } catch (error) {
        return {error: JSON.stringify({'type': 'method', method: 'queryByTimestamp', 'error': error.message})}
      }
    }

    return {
      create, read, update, remove, queryByTimestamp
    }
  } catch (error) {
    CONSOLE.error('getMethods', error)
    return { error: 'getMethods error' }
  }
}

module.exports = service
