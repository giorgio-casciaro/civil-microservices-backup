const fs = require('fs')
const path = require('path')
const checkRequired = require('./utils').checkRequired
const getConsole = (serviceName, serviceId, pack) => require('./utils').getConsole({error: true, debug: true, log: true, warn: true}, serviceName, serviceId, pack)
var PACKAGE = 'schemaManager'
var CONSOLE = getConsole(PACKAGE, '----', '-----')

var SCHEMA = {}

module.exports = function getSchemaManager ({updateSchema, savePath, serviceName, intervall = 5000, defaultField = 'methods'}) {
  checkRequired({updateSchema, savePath, serviceName}, PACKAGE)
  var updateServiceSchema = () => {
    var serviceSchema = JSON.stringify(updateSchema())
    if (serviceSchema != JSON.stringify(SCHEMA[serviceName])) {
      CONSOLE.log('SAVING TO FILE', serviceName + '.json')
      fs.writeFileSync(path.join(savePath, serviceName + '.json'), serviceSchema, 'utf-8')
    }
  }
  var schemaInterval = setInterval(updateServiceSchema, intervall)
  var readServicesSchema = () => {
    fs.readdirSync(savePath).forEach(file => {
      if (file.indexOf('.json'))SCHEMA[file.replace('.json', '')] = JSON.parse(fs.readFileSync(path.join(savePath, file), 'utf-8'))
    })
  }
  setInterval(readServicesSchema, intervall)
  updateServiceSchema()
  readServicesSchema()
  return {
    get (field = defaultField, service = serviceName, exclude) {
      if (service === '*') return Object.keys(SCHEMA).filter((serviceName) => serviceName !== exclude).map((serviceName) => { return {items: SCHEMA[serviceName][field], service: serviceName} })
      else return SCHEMA[service][field]
    },
    stop () {
      clearInterval(schemaInterval)
    },
    getSchema: () => SCHEMA
  }
}
