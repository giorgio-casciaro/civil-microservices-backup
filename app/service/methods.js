// var MongoClient = require('mongodb').MongoClient
process.on('unhandledRejection', (err, p) => {
  console.log('An unhandledRejection occurred')
  console.log(`Rejected Promise: ${p}`)
  console.log(`Rejection: ${err}`)
})

const path = require('path')

var service = async function getMethods (CONSOLE, netClient, CONFIG = require('./config'), schemaClient) {
  try {
    CONSOLE.debug('CONFIG', CONFIG)
    return {
      async getSchema (reqData, meta = {directCall: true}, getStream = null) {
        return { schema: schemaClient.getSchema() }
      },
      async getPublicApiSchema (reqData, meta = {directCall: true}, getStream = null) {
        var schema = schemaClient.getSchema()
        var publicSchema = {}
        for (var serviceName in schema) {
          if (schema[serviceName].exportToPublicApi) {
            publicSchema[serviceName] = {}
            for (var methodName in schema[serviceName].methods) {
              if (schema[serviceName].methods[methodName].public) {
                publicSchema[serviceName][methodName] = schema[serviceName].methods[methodName].requestSchema
              }
            }
          }
        }
        return { publicSchema }
      },
      async proxy (reqData, meta = {directCall: true}, getStream = null) {
        return await netClient.rpcCall({to: reqData.service, method: reqData.method, data: reqData.data, meta: reqData.meta})
      }
    }
  } catch (error) {
    CONSOLE.error('getMethods', error)
    return { error: 'getMethods error' }
  }
}

module.exports = service
