// var MongoClient = require('mongodb').MongoClient
process.on('unhandledRejection', (err, p) => {
  console.log('An unhandledRejection occurred')
  console.log(`Rejected Promise: ${p}`)
  console.log(`Rejection: ${err}`)
})

const path = require('path')

const uuid = require('uuid/v4')

var elasticsearch = require('elasticsearch')
var getSearchClient = (config) => new elasticsearch.Client(Object.assign({}, config.elasticsearch))

var co = require('co')

// Connection URL
// Use connect method to connect to the Server

var service = co.wrap(function* getMethods (CONSOLE, netClient, CONFIG = require('./config')) {
  var elasticsearch = require('elasticsearch')
  var eClient = new elasticsearch.Client(CONFIG.elasticsearch)
  // var pingResponse = yield eClient.ping({
  //   requestTimeout: 10000
  // })
  // t.same(pingResponse, true, 'elasticsearch ping')
  // var searchResponse = yield eClient.search({
  //   q: 'test'
  // })
  //
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
    createView, readView, updateView, removeView
  }
})

module.exports = service
