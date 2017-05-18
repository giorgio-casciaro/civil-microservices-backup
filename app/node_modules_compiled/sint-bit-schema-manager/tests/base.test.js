
var R = require('ramda')
var request = require('request')
var t = require('tap')
var path = require('path')
var schemaManager = require('../schemaManager')

const getConsole = (serviceName, serviceId, pack) => require('../utils').getConsole({error: true, debug: true, log: false, warn: true}, serviceName, serviceId, pack)
var CONSOLE = getConsole('BASE TEST', '----', '-----')

t.test('*** NET ***', {
  autoend: true
}, async function mainTest (t) {
  var schema1 = {
    config1: {
      item: 'test1'
    },
    config2: {
      item: 'test1'
    }
  }

  var schema2 = {
    config1: {
      item: 'test2'
    },
    config2: {
      item: 'test2'
    }
  }

  var updateSchema1 = () => schema1
  var updateSchema2 = () => schema2
  var allSchemas = { service1: schema1, service2: schema2 }
  var savePath = path.join(__dirname, './schema')

  var schemaManager1 = schemaManager({ updateSchema: updateSchema1, savePath, serviceName: 'service1', intervall: 1000, defaultField: 'config1' })
  var schemaManager2 = schemaManager({ updateSchema: updateSchema2, savePath, serviceName: 'service2', intervall: 1000, defaultField: 'config1' })

  t.plan(17)
  t.same(schemaManager1.get(), schema1.config1, 'get()')
  t.same(schemaManager1.get('config2'), schema1.config2, "get('config2')")
  t.same(schemaManager1.get('config2', 'service2'), schema2.config2, "get('config2','service2')")
  t.same(schemaManager1.get('config2', '*').length, 2, "get('config2', '*').length")
  t.same(schemaManager1.get('config2', '*')[0].items, schema1.config2, "get('config2', '*')[0].items")
  t.same(schemaManager1.get('config2', '*', 'service1').length, 1, "get('config2', '*', 'service1').length")
  t.same(schemaManager1.get('config2', '*', 'service1')[0].items, schema2.config2, "get('config2', '*', 'service1')[0].items")
  t.same(schemaManager1.get('config2', '*', 'service1')[0].service, 'service2', "get('config2', '*', 'service1')[0].service")

  schema1.config1 = {
    item: 'test1 updated'
  }
  schema1.config2 = {
    item: 'test2 updated'
  }
  schema2.config2 = {
    item: 'test2 updated'
  }
  t.notSame(schemaManager1.get(), schema1.config1, 'get() CHANGE not propagated')

  await new Promise((resolve) => setTimeout(resolve, 1100))

  t.same(schemaManager1.get(), schema1.config1, 'get() AFTER CHANGE')
  t.same(schemaManager1.get('config2'), schema1.config2, "get('config2') AFTER CHANGE")
  t.same(schemaManager1.get('config2', 'service2'), schema2.config2, "get('config2','service2') AFTER CHANGE")
  t.same(schemaManager1.get('config2', '*').length, 2, "get('config2', '*').length AFTER CHANGE")
  t.same(schemaManager1.get('config2', '*')[0].items, schema1.config2, "get('config2', '*')[0].items AFTER CHANGE")
  t.same(schemaManager1.get('config2', '*', 'service1').length, 1, "get('config2', '*', 'service1').length AFTER CHANGE")
  t.same(schemaManager1.get('config2', '*', 'service1')[0].items, schema2.config2, "get('config2', '*', 'service1')[0].items AFTER CHANGE")
  t.same(schemaManager1.get('config2', '*', 'service1')[0].service, 'service2', "get('config2', '*', 'service1')[0].service AFTER CHANGE")

  t.end()
  // process.exit()
}).then(() => process.exit())
