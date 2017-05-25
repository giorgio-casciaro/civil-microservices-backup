var R = require('ramda')
const uuidV4 = require('uuid/v4')
const PACKAGE = 'net.server'
const checkRequired = require('./utils').checkRequired
var Ajv = require('ajv')
var ajvNoRemoveAdditional = new Ajv({ allErrors: true , removeAdditional: false})
var ajvRemoveAdditional = new Ajv({ allErrors: true, removeAdditional: true })
var validateMsg = ajvRemoveAdditional.compile(require('./schemas/message.schema.json'))

const getConsole = (serviceName, serviceId, pack) => require('./utils').getConsole({error: true, debug: true, log: true, warn: true}, serviceName, serviceId, pack)

module.exports = function getNetServerPackage ({ serviceName = 'unknow', serviceId = 'unknow', getMethods, getMethodsConfig, getNetConfig}) {
  var CONSOLE = getConsole(serviceName, serviceId, PACKAGE)
  try {
    checkRequired({getMethods, getMethodsConfig, getConsole, getNetConfig}, PACKAGE)
    var config
    var validateMessage = (data) => {
      if (!validateMsg(data)) {
        CONSOLE.error('MESSAGE IS NOT VALID ', {errors: validate.errors})
        throw new Error('MESSAGE IS NOT VALID', {errors: validateMsg.errors})
      } else return data
    }
    var validateWithSchema = (methodConfig, methodName, data, schemaField = 'requestSchema') => {
      CONSOLE.log('validate ', { methodConfig: methodConfig[schemaField], methodName, data, schemaField })
      if (!methodConfig[schemaField]) throw new Error(schemaField + ' not defined in methods.json ' + methodName)
      var schema = Object.assign({
        'type': 'object',
        'additionalProperties': false
      }, methodConfig[schemaField])

      var ajv = ajvNoRemoveAdditional
      if (!schema.additionalProperties)ajv = ajvRemoveAdditional
      var validate = ajv.compile(schema)
      var valid = validate(data)
      if (!valid) {
        throw new Error(JSON.stringify({'type': 'schemaValidation', methodName, data, schemaField, 'errors': validate.errors}))
      } else return data
    }
    function getMethodMeta (metaRaw = {}, channel) {
      return Object.assign({}, metaRaw, {
        corrid: metaRaw.corrid || uuidV4(),
        // userid: metaRaw.userid || 'UNKNOW',
        from: metaRaw.from || 'UNKNOW',
        reqintime: metaRaw.timestamp || 'UNKNOW',
        timestamp: Date.now(),
        reqtype: 'out',
        channel: channel || metaRaw.channel || 'UNKNOW',
        stream: metaRaw.stream || false
      })
    }
    async function getMethod (methodName) {
      var methods = await getMethods()
      if (!methods[methodName]) throw new Error(methodName + ' is not valid (not defined service methods js file)')
      return methods[methodName]
    }
    async function getMethodConfig (methodName, publicApi = false, service = serviceName) {
      var serviceMethodsConfig = await getMethodsConfig(service)
      if (!serviceMethodsConfig[methodName]) throw new Error(methodName + ' is not valid (not defined in methods config)')
      if (!serviceMethodsConfig[methodName].public && publicApi) throw new Error(methodName + ' is not public')
      return serviceMethodsConfig[methodName]
    }
    var getChannel = (channelName) => require(`./channels/${channelName}.server`)({getConsole, methodCall, serviceName, serviceId, config: config.channels[channelName]})
    var forEachChannel = (func) => Object.keys(config.channels).forEach((channelName) => func(getChannel(channelName)))

    var methodCall = async function methodCall (message, getStream, publicApi = true, channel = 'UNKNOW') {
      try {
        CONSOLE.log('=> SERVER IN', {message})
        validateMessage(message)

        // CONFIG
        var methodName = message.method
        var meta = getMethodMeta(message.meta, channel)
        var data = message.data || {}
        var method = await getMethod(methodName)
        var methodConfig = await getMethodConfig(methodName, publicApi)

        // VALIDATION
        data = validateWithSchema(methodConfig, methodName, data, 'requestSchema')

        // CALL
        var response

        if (methodConfig.responseType === 'noResponse') {
          method(data, meta, getStream || null)
          response = null
        } else if (methodConfig.responseType === 'aknowlegment') {
          method(data, meta, getStream || null)
          response = {'aknowlegment': 1}
        } else if (methodConfig.responseType === 'response') {
          response = await method(data, meta, getStream || null)
          response = validateWithSchema(methodConfig, methodName, response, 'responseSchema')
        } else {
          response = await method(data, meta, getStream || null)
        }

        CONSOLE.log('SERVER OUT => ', {response, responseType: methodConfig.responseType})
        return response
      } catch (error) {
        return {'type': 'method', method: methodName, 'error': error.message}
      }
    }
    return {
      async start () {
        config = await getNetConfig(serviceName)
        CONSOLE.log('START CHANNELS SERVERS ', serviceName, config)
        checkRequired({channels: config.channels}, PACKAGE)
        forEachChannel((channel) => channel.start())
      },
      stop () {
        CONSOLE.debug('STOP CHANNELS SERVERS ', {channels: config.channels})
        forEachChannel((channel) => channel.stop())
      },
      restart () {
        CONSOLE.debug('RESTART CHANNELS SERVERS ', {channels: config.channels})
        forEachChannel((channel) => channel.restart())
      }
    }
  } catch (error) {
    CONSOLE.error(error)
    throw new Error('Error during getNetServerPackage')
  }
}
