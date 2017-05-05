// var MongoClient = require('mongodb').MongoClient
process.on('unhandledRejection', (err, p) => {
  console.log('An unhandledRejection occurred')
  console.log(`Rejected Promise: ${p}`)
  console.log(`Rejection: ${err}`)
})

const path = require('path')
const uuid = require('uuid/v4')
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
        throw new Error('problems during mutate ' + error)
      }
    }
    var initViewsInited = false
    const initViews = async function () {
      try {
        if (initViewsInited) return false
        initViewsInited = true
        await kvDb.createIndex(kvDbClient, { ns: CONFIG.aerospike.namespace, set: CONFIG.aerospike.set, bin: 'email', index: CONFIG.aerospike.set + '_email', datatype: Aerospike.indexDataType.STRING })
        await kvDb.createIndex(kvDbClient, { ns: CONFIG.aerospike.namespace, set: CONFIG.aerospike.set, bin: 'updated', index: CONFIG.aerospike.set + '_updated', datatype: Aerospike.indexDataType.NUMERIC })
        await kvDb.createIndex(kvDbClient, { ns: CONFIG.aerospike.namespace, set: CONFIG.aerospike.set, bin: 'created', index: CONFIG.aerospike.set + '_created', datatype: Aerospike.indexDataType.NUMERIC })
      } catch (error) { throw new Error('problems during initViews') }
    }
    const updateView = async function (id, mutations, isNew) {
      try {
        initViews()
        var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.set, id)
        var view = await getView(id, null, null, false) || {state: {}}
        var state = mutationsPack.applyMutations(view.state, mutations)
        view.updated = Date.now()
        view.email = state.email || ''
        view.id = state.id
        view.status = state.status
        if (!view.created)view.created = Date.now()

        view.state = JSON.stringify(state)
        await kvDb.put(kvDbClient, key, view)
        return view
      } catch (error) { throw new Error('problems during updateView ' + error) }
    }
    const getView = async function (id, status = null, view = null, stateOnly = true) {
      // console.log("getView",id, status, view , stateOnly )
      try {
        var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.set, id)
        if (!view) view = await kvDb.get(kvDbClient, key)
        if (!view || (status && status.indexOf(view.status) < 0)) return null
        if (view.state)view.state = JSON.parse(view.state)
        if (stateOnly) return view.state
        return view
      } catch (error) { throw new Error('problems during getView ' + error) }
    }
    const getUserByMail = async function (email, status) {
      // console.log("getUserByMail",email, status )
      var result = await kvDb.query(kvDbClient, CONFIG.aerospike.namespace, CONFIG.aerospike.set, (dbQuery) => {
        dbQuery.where(Aerospike.filter.equal('email', email))
      })
      if (!result[0]) return null
      console.log(result[0].id, true, result[0])
      return await getView(result[0].id, status, result[0])
    }
    const updateStatus = async function (id, status, meta) {
      var mutation = await mutate({data: {status}, objId: id, mutation: 'updateStatus', meta})
      await updateView(id, [mutation])
    }
    return {
      async create (reqData, meta = {directCall: true}, getStream = null) {
        try {
          var mailExists = await getUserByMail(reqData.email)
          if (mailExists) throw new Error('User exists')
          var id = uuid()
          reqData.id = id
          reqData.emailConfirmationCode = uuid()
          var mutation = await mutate({data: reqData, objId: id, mutation: 'create', meta})
          await updateView(id, [mutation], true)
          return {success: `User created`, id}
        } catch (error) { return {'type': 'method', method: 'create', 'error': error.message} }
      },
      async readEmailConfirmationCode (reqData, meta = {directCall: true}, getStream = null) {
        try {
          var id = reqData.id
          var currentState = await getView(id)
          return {emailConfirmationCode: currentState.emailConfirmationCode}
        } catch (error) { return {'type': 'method', method: 'readEmailConfirmationCode', 'error': error.message} }
      },
      async confirmEmail (reqData, meta = {directCall: true}, getStream = null) {
        try {
          var id = reqData.id
          var currentState = await getView(id)
          if (currentState.emailConfirmationCode !== reqData.emailConfirmationCode) throw new Error('emailConfirmationCode not valid')
          var mutation = await mutate({ data: {}, objId: id, mutation: 'confirmEmail', meta })
          await updateView(id, [mutation])
          if (currentState.status === 0) await updateStatus(id, 1, meta)
          if (currentState.status === 1) await updateStatus(id, 2, meta)
          return {success: `Email confirmed`}
        } catch (error) { return {error: JSON.stringify({'type': 'method', method: 'confirmMail', 'error': error.message})} }
      },
      async read (reqData, meta = {directCall: true}, getStream = null) {
        try {
          var id = reqData.id
          var currentState = await getView(id)
          if (!currentState) throw new Error('user not active')
          return currentState
        } catch (error) { return {'type': 'method', method: 'read', 'error': error.message} }
      },
      async updatePublicName (reqData, meta = {directCall: true}, getStream = null) {
        try {
          var id = reqData.id
          var mutation = await mutate({data: reqData, objId: id, mutation: 'updatePublicName', meta})
          await updateView(id, [mutation])
          return {success: `Public Name updated`}
        } catch (error) {
          return {error: JSON.stringify({'type': 'method', method: 'updatePublicName', 'error': error.message})}
        }
      },
      async updatePic (reqData, meta = {directCall: true}, getStream = null) {
        try {
          var id = reqData.id
          var mutation = await mutate({data: reqData, objId: id, mutation: 'updatePic', meta})
          await updateView(id, [mutation])
          return {success: `Pic updated`}
        } catch (error) {
          return {error: JSON.stringify({'type': 'method', method: 'updatePic', 'error': error.message})}
        }
      },
      async updatePassword (reqData, meta = {directCall: true}, getStream = null) {
        try {
          var bcrypt = require('bcrypt')
          var id = reqData.id
          if (reqData.password !== reqData.confirmPassword) throw new Error('Confirm Password not equal')
          var currentState = await getView(id)
          if (!currentState) throw new Error('user not active')
          if (currentState.password && !bcrypt.compareSync(reqData.oldPassword, currentState.password)) throw new Error('Old Password not valid')
          var data = {password: bcrypt.hashSync(reqData.password, 10)}
          var mutation = await mutate({data, objId: id, mutation: 'updatePassword', meta})
          await updateView(id, [mutation])
          if (currentState.status === 0) await updateStatus(id, 1, meta)
          if (currentState.status === 1) await updateStatus(id, 2, meta)
          return {success: `Password updated`}
        } catch (error) {
          return {error: JSON.stringify({'type': 'method', method: 'updatePassword', 'error': error.message})}
        }
      },
      async login (reqData, meta = {directCall: true}, getStream = null) {
        try {
          var bcrypt = require('bcrypt')
          var currentState = await getUserByMail(reqData.email, [2])
          if (!currentState) throw new Error('Login error ')
          if (!bcrypt.compareSync(reqData.password, currentState.password)) throw new Error('Login error 2')
          return {success: `Login`, id: currentState.id}
        } catch (error) {
          return {error: JSON.stringify({'type': 'method', method: 'login', 'error': error.message})}
        }
      },
      async updatePersonalInfo (reqData, meta = {directCall: true}, getStream = null) {
        try {
          var id = reqData.id
          var mutation = await mutate({data: reqData, objId: id, mutation: 'updatePersonalInfo', meta})
          await updateView(id, [mutation])
          return {success: `Personal Info updated`}
        } catch (error) {
          return {error: JSON.stringify({'type': 'method', method: 'updatePersonalInfo', 'error': error.message})}
        }
      },
      async readPersonalInfo (reqData, meta = {directCall: true}, getStream = null) {
        try {
          var id = reqData.id
          var currentState = await getView(id)
          return currentState
        } catch (error) { return {'type': 'method', method: 'readPersonalInfo', 'error': error.message} }
      },
      async remove (reqData, meta = {directCall: true}, getStream = null) {
        try {
          await updateStatus(reqData.id, 0, meta)
          return {success: `User removed`}
        } catch (error) { return {'type': 'method', method: 'remove', 'error': error.message} }
      },
      async queryByTimestamp (query = {}, meta = {directCall: true}, getStream = null) {
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
    }
  } catch (error) {
    CONSOLE.error('getMethods', error)
    return { error: 'getMethods error' }
  }
}

module.exports = service
