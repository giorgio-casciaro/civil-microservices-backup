// var MongoClient = require('mongodb').MongoClient
process.on('unhandledRejection', (err, p) => {
  console.log('An unhandledRejection occurred')
  console.log(`Rejected Promise: ${p}`)
  console.log(`Rejection: ${err}`)
})

const path = require('path')
const uuid = require('uuid/v4')
var jwt = require('jsonwebtoken')

const Aerospike = require('aerospike')
const Key = Aerospike.Key
var kvDb = require('./lib/kvDb')

const nodemailer = require('nodemailer')
const vm = require('vm')
const fs = require('fs')

var service = async function getMethods (CONSOLE, netClient, CONFIG = require('./config')) {
  try {
    CONSOLE.debug('CONFIG', CONFIG)
    var kvDbClient = await kvDb.getClient(CONFIG.aerospike)
    // SMTP
    var smtpTrans = nodemailer.createTransport(require('./config').smtp)
    const getMailTemplate = async (template, sandbox = { title: 'title', header: 'header', body: 'body', footer: 'footer' }, ext = '.html') => {
      var populate = (content) => vm.runInNewContext('returnVar=`' + content.replace(new RegExp('`', 'g'), '\\`') + '`', sandbox)
      var result = await new Promise((resolve, reject) => fs.readFile(path.join(__dirname, '/emails/', template + ext), 'utf8', (err, data) => err ? reject(err) : resolve(populate(data))))
      return result
    }
    const sendMail = async (template = 'userCreated', mailOptions, mailContents) => {
      mailOptions.html = await getMailTemplate(template, mailContents, '.html')
      mailOptions.txt = await getMailTemplate(template, mailContents, '.txt')
      CONSOLE.log('sendMail', mailOptions)
      return await new Promise((resolve, reject) => smtpTrans.sendMail(mailOptions, (err, data) => err ? reject(err) : resolve(data)))
    }
    // MUTATIONS
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
    // INIT
    var initStatus = false
    const init = async function () {
      try {
        if (initStatus) return false
        initStatus = true
        await kvDb.createIndex(kvDbClient, { ns: CONFIG.aerospike.namespace, set: CONFIG.aerospike.set, bin: 'email', index: CONFIG.aerospike.set + '_email', datatype: Aerospike.indexDataType.STRING })
        await kvDb.createIndex(kvDbClient, { ns: CONFIG.aerospike.namespace, set: CONFIG.aerospike.set, bin: 'updated', index: CONFIG.aerospike.set + '_updated', datatype: Aerospike.indexDataType.NUMERIC })
        await kvDb.createIndex(kvDbClient, { ns: CONFIG.aerospike.namespace, set: CONFIG.aerospike.set, bin: 'created', index: CONFIG.aerospike.set + '_created', datatype: Aerospike.indexDataType.NUMERIC })
      } catch (error) { throw new Error('problems during init') }
    }
    // VIEWS
    const updateView = async function (id, mutations, isNew) {
      try {
        var key = new Key(CONFIG.aerospike.namespace, CONFIG.aerospike.set, id)
        var rawView = await getView(id, null, null, false) || {state: {}}
        var state = mutationsPack.applyMutations(rawView.state, mutations)
        var view = {
          updated: Date.now(),
          created: rawView.created || Date.now(),
          email: state.email || '',
          id: state.id,
          status: state.status,
          state: JSON.stringify(state)
        }
        await kvDb.put(kvDbClient, key, view)
        return view
      } catch (error) { throw new Error('problems during updateView ' + error) }
    }
    const getView = async function (id, status = null, view = null, stateOnly = true) {
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
      try {
        var result = await kvDb.query(kvDbClient, CONFIG.aerospike.namespace, CONFIG.aerospike.set, (dbQuery) => {
          dbQuery.where(Aerospike.filter.equal('email', email))
        })
        if (!result[0]) return null
        return await getView(result[0].id, status, result[0])
      } catch (error) { throw new Error('problems during getUserByMail ' + error) }
    }
    const updateStatus = async function (id, status, meta) {
      var mutation = await mutate({data: {status}, objId: id, mutation: 'updateStatus', meta})
      await updateView(id, [mutation])
    }
    // PERMISSIONS
    const createToken = async (data, meta) => {
      var permissions = await netClient.emit('getPermissions', data, meta)
      permissions = permissions.reduce((a, b) => a.concat(b.permissions), [])
      var tokenData = { permissions, exp: Math.floor(Date.now() / 1000) + (60 * 60) }
      return await new Promise((resolve, reject) => {
        jwt.sign(tokenData, CONFIG.jwt.privateCert, { algorithm: 'RS256' }, (err, token) => { if (err) reject(err); else resolve(token) })
      })
    }
    const getToken = (token) => new Promise((resolve, reject) => {
      jwt.verify(token, CONFIG.jwt.publicCert, (err, decoded) => { if (err) reject(err); else resolve(decoded) })
    })
    const userCan = async function (permission, meta) {
      var tokenData = await getToken(meta.token)
      var permissionsSorted = tokenData.permissions.sort((a, b) => b[0] - a[0])
      var permissionsByLevel = Object.values(permissionsSorted.reduce((a, b) => {
        if (!a[b[0]])a[b[0]] = []
        a[b[0]].push(b.slice(1))
        return a
      }, {}))

      var checkPermissionName = (permissionToCheck) => {
        if (permissionToCheck === permission) return true
        permissionToCheck = permissionToCheck.replace(new RegExp('([\\.\\\\\\+\\*\\?\\[\\^\\]\\$\\(\\)\\{\\}\\=\\!\\<\\>\\|\\:\\-])', 'g'), '\\$1')
        permissionToCheck = permissionToCheck.replace(/\\\*/g, '(.*)').replace(/_/g, '.')
        var check = RegExp('^' + permissionToCheck + '$', 'gi').test(permission)
        return check
      }
      var havePermission = false
      for (var levelPermissions of permissionsByLevel) {
        var levelPermissionsValues = []
        levelPermissions.forEach((sp) => {
          var spName = sp[0]
          if (checkPermissionName(spName)) {
            var spValue
            if (typeof sp[1] === 'number') {
              spValue = sp[1]
            } else if (typeof sp[1] === 'string') {
              var spFunc = require('./permissions/' + sp[1])
              var spArgs = sp[2]
              spValue = spFunc(permission, meta, spArgs)
            }
            levelPermissionsValues.push(spValue)
          }
        })

        console.log('PERMISSIONS levelPermissionsValues', levelPermissionsValues, levelPermissions)
        // 0(one or more) stop loop and deny permission,
        if (levelPermissionsValues.indexOf(0) !== -1) {
          havePermission = false
          break
        }
        // 2(one or more) stop loop and give permission,
        if (levelPermissionsValues.indexOf(2) !== -1) {
          havePermission = true
          break
        }
        // 1(one or more) go to next loop
        havePermission = true
      }
      console.log('PERMISSIONS havePermission', havePermission)
      // var havePermission = (tokenData.permissions.indexOf(permission) < 0)
      if (!havePermission) throw new Error('No permission')
    }
    init()

    return {
      async getPermissions (reqData, meta = {directCall: true}, getStream = null) {
        return {permissions: [
        [5, 'user.*', 'test2', {testParam: 34}],
          [1, 'user.write.*', 1],
          [1, 'user.read.*', 1, 1],
          [1, 'user.private.*', 'test', {testParam: 34}],
          [2, 'user.private.*', 'test2', {testParam: 34}],
          [2, 'user.private.*', 1, {testParam: 34}]
        ]}
      },
      async create (reqData, meta = {directCall: true}, getStream = null) {
        var mailExists = await getUserByMail(reqData.email)
        if (mailExists) throw new Error('User exists')
        var id = uuid()
        reqData.id = id
        reqData.emailConfirmationCode = uuid()
        var mutation = await mutate({data: reqData, objId: id, mutation: 'create', meta})
        var sendMailResult = await sendMail('userCreated', {to: reqData.email, from: CONFIG.mailFrom, subject: 'Benvenuto in CivilConnect - conferma la mail'}, Object.assign({publicUrl: CONFIG.publicUrl}, reqData))
        CONSOLE.log('sendMailResult', sendMailResult)
        await updateView(id, [mutation], true)
        return {success: `User created`, id}
      },
      async readEmailConfirmationCode (reqData, meta = {directCall: true}, getStream = null) {
        var id = reqData.id
        var currentState = await getView(id)
        return {emailConfirmationCode: currentState.emailConfirmationCode}
      },
      async confirmEmail (reqData, meta = {directCall: true}, getStream = null) {
        var id = reqData.id
        var currentState = await getView(id)
        if (currentState.emailConfirmationCode !== reqData.emailConfirmationCode) throw new Error('emailConfirmationCode not valid')
        var mutation = await mutate({ data: {}, objId: id, mutation: 'confirmEmail', meta })
        await updateView(id, [mutation])
        if (currentState.status === 0) await updateStatus(id, 1, meta)
        if (currentState.status === 1) await updateStatus(id, 2, meta)
        return {success: `Email confirmed`}
      },
      async read (reqData, meta = {directCall: true}, getStream = null) {
        await userCan('user.read', meta)
        var id = reqData.id
        var currentState = await getView(id, [2])
        if (!currentState) throw new Error('user not active')
        return currentState
      },
      async readPrivate (reqData, meta = {directCall: true}, getStream = null) {
        var id = reqData.id
        await userCan('user.private.read.' + id, meta)
        var currentState = await getView(id)
        if (!currentState) throw new Error('user not active')
        return currentState
      },
      async updatePublicName (reqData, meta = {directCall: true}, getStream = null) {
        var id = reqData.id
        await userCan('user.write' + id, meta)
        var mutation = await mutate({data: reqData, objId: id, mutation: 'updatePublicName', meta})
        await updateView(id, [mutation])
        return {success: `Public Name updated`}
      },
      async updatePic (reqData, meta = {directCall: true}, getStream = null) {
        var id = reqData.id
        await userCan('user.write.' + id, meta)
        var mutation = await mutate({data: reqData, objId: id, mutation: 'updatePic', meta})
        await updateView(id, [mutation])
        return {success: `Pic updated`}
      },
      async updatePassword (reqData, meta = {directCall: true}, getStream = null) {
        var id = reqData.id
        await userCan('user.private.write.' + id, meta)
        if (reqData.password !== reqData.confirmPassword) throw new Error('Confirm Password not equal')
        var currentState = await getView(id, [2])
        if (!currentState) throw new Error('user not active')
        var bcrypt = require('bcrypt')
        if (currentState.password && !bcrypt.compareSync(reqData.oldPassword, currentState.password)) throw new Error('Old Password not valid')
        var data = {password: bcrypt.hashSync(reqData.password, 10)}
        var mutation = await mutate({data, objId: id, mutation: 'updatePassword', meta})
        await updateView(id, [mutation])
        return {success: `Password updated`}
      },
      async assignPassword (reqData, meta = {directCall: true}, getStream = null) {
        var id = reqData.id
        if (reqData.password !== reqData.confirmPassword) throw new Error('Confirm Password not equal')
        var currentState = await getView(id, [0, 1])
        if (!currentState) throw new Error('user not active')
        var data = {password: require('bcrypt').hashSync(reqData.password, 10)}
        var mutation = await mutate({data, objId: id, mutation: 'assignPassword', meta})
        await updateView(id, [mutation])
        if (currentState.status === 0) await updateStatus(id, 1, meta)
        if (currentState.status === 1) await updateStatus(id, 2, meta)
        return {success: `Password assigned`}
      },
      async login (reqData, meta = {directCall: true}, getStream = null) {
        var bcrypt = require('bcrypt')
        var currentState = await getUserByMail(reqData.email, [2])
        if (!currentState) throw new Error('Login error')
        if (!bcrypt.compareSync(reqData.password, currentState.password)) throw new Error('Login error')
        delete reqData.password
        var token = await createToken({id: currentState.id}, meta)
        return {success: `Login`, id: currentState.id, token}
      },
      async updatePersonalInfo (reqData, meta = {directCall: true}, getStream = null) {
        var id = reqData.id
        await userCan('user.write.' + id, meta)
        var mutation = await mutate({data: reqData, objId: id, mutation: 'updatePersonalInfo', meta})
        await updateView(id, [mutation])
        return {success: `Personal Info updated`}
      },
      async readPersonalInfo (reqData, meta = {directCall: true}, getStream = null) {
        var id = reqData.id
        await userCan('user.write.' + id, meta)
        var currentState = await getView(id)
        return currentState
      },
      async remove (reqData, meta = {directCall: true}, getStream = null) {
        await userCan('user.write.' + reqData.id, meta)
        await updateStatus(reqData.id, 0, meta)
        return {success: `User removed`}
      },
      async queryByTimestamp (query = {}, meta = {directCall: true}, getStream = null) {
        await userCan('user.read.query', meta)
        query = Object.assign({from: 0, to: 100000000000000}, query)
        var rawResults = await kvDb.query(kvDbClient, CONFIG.aerospike.namespace, CONFIG.aerospike.set, (dbQuery) => { dbQuery.where(Aerospike.filter.range('updated', query.from, query.to)) })
        var results = await Promise.all(rawResults.map((result) => getView(result.id, null, result)))
        return results
      }
    }
  } catch (error) {
    CONSOLE.error('getMethods', error)
    return { error: 'getMethods error' }
  }
}

module.exports = service
