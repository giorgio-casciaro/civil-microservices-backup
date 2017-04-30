var R = require('ramda')
const uuidV4 = require('uuid/v4')
var ajv = require('ajv')({allErrors: true})
const PACKAGE = 'net.server'
const checkRequired = require('./utils').checkRequired
var validateMsg = ajv.compile(require('./schemas/message.schema.json'))

const getConsole = (serviceName, serviceId, pack) => require('./utils').getConsole({error: true, debug: true, log: true, warn: true}, serviceName, serviceId, pack)


module.exports = function getNetServerPackage ({  serviceName = 'unknow', serviceId = 'unknow', getMethods, getMethodsConfig, getNetConfig}) {
  var CONSOLE = getConsole(serviceName, serviceId, PACKAGE)
  checkRequired({getMethods, getMethodsConfig, getConsole, getNetConfig}, PACKAGE)
  CONSOLE.debug('getNetServerPackage ', { })
  var validateRequest = (data) => {
    if (!validateMsg(data)) {
      CONSOLE.error('MESSAGE IS NOT VALID ', {errors: validate.errors})
      throw new Error('MESSAGE IS NOT VALID', {errors: validateMsg.errors})
    } else return data
  }
  var validateResponse = (methodConfig, methodName, data, schemaField = 'requestSchema') => {
    CONSOLE.debug('validate ', { methodConfig, methodName, data, schemaField })
    if (!methodConfig[schemaField]) throw new Error(schemaField + ' not defined in methods.json ' + methodName)
    var validate = ajv.compile(methodConfig[schemaField])
    var valid = validate(data)
    if (!valid) {
      CONSOLE.error('validation errors ', {errors: validate.errors, methodName, data, schemaField})
      throw new Error('validation error ', {errors: validate.errors})
    } else return data
  }
  try {
  // var defaultEventListen = require('./default.event.listen.json')
    var config

    var getChannel = (channelName) => require(`./channels/${channelName}.server`)({getConsole, methodCall, serviceName, serviceId, config: config.channels[channelName]})
    var forEachChannel = (func) => Object.keys(config.channels).forEach((channelName) => func(getChannel(channelName)))

    // ogni method call può avere più dati anche dauserid e requestid diversi
    var methodCall = async function methodCall (message, getStream, publicApi = true, channel = 'UNKNOW') {
      try {
        CONSOLE.log('=> SERVER IN', {message})
        validateRequest(message)

        var methodName = message.method
        var meta = message.meta || {}
        meta.corrid = meta.corrid || uuidV4()
        meta.userid = meta.userid || 'UNKNOW'
        meta.from = meta.from || 'UNKNOW'
        meta.reqInTimestamp = Date.now()
        meta.channel = channel
        var data = message.data || {}

        var serviceMethodsConfig = await getMethodsConfig(serviceName)
        var methods = await getMethods()
        if (!serviceMethodsConfig[methodName]) throw new Error(methodName + ' is not valid (not defined in methods config)')
        if (!serviceMethodsConfig[methodName].public && publicApi) throw new Error(methodName + ' is not public')
        if (!methods[methodName]) throw new Error(methodName + ' is not valid (not defined service methods js file)')
        var method = methods[methodName]
        var methodConfig = serviceMethodsConfig[methodName]
        CONSOLE.debug('methodCall', {message, getStream, publicApi, serviceMethodsConfig, methodConfig}, serviceName)

        data = validateResponse(methodConfig, methodName, data, 'requestSchema')

        var response
        // if noResponse not await response on the client side
        // if aknowlegment await response on the client side but not await response on the server side
        if (methodConfig.responseType === 'noResponse' || methodConfig.responseType === 'aknowlegment') {
          method(data, meta, getStream || null)
          response = null
        } else if (methodConfig.responseType === 'response') {
          response = await method(data, meta, getStream || null)
          response = validateResponse(methodConfig, methodName, response, 'responseSchema')
        } else {
          response = await method(data, meta, getStream || null)
        }

        CONSOLE.log('SERVER OUT => ', {response, responseType: methodConfig.responseType})
        CONSOLE.debug('MAIN RESPONSE ' + methodName, response)
        return response
      } catch (error) {
        CONSOLE.error(error, {methodName})
        throw new Error('Error during methodCall')
      }
    }
    return {
      async start () {
        config = await getNetConfig(serviceName)
        CONSOLE.debug('START CHANNELS SERVERS ',config)
        checkRequired({channels:config.channels}, PACKAGE)
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
