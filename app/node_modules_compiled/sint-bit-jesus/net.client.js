const PACKAGE = 'net.client'
const R = require('ramda')
const uuidV4 = require('uuid/v4')
const checkRequired = require('./utils').checkRequired
var preferedChannels = ['grpc', 'zeromq', 'http']
// var delayedMessages = global.JESUS_NET_CLIENT_delayedMessages = global.JESUS_NET_CLIENT_delayedMessages || {}
const getConsole = (serviceName, serviceId, pack) => require('./utils').getConsole({error: true, debug: true, log: true, warn: true}, serviceName, serviceId, pack)

module.exports = function getNetClientPackage ({serviceName = 'unknow', serviceId = 'unknow', getNetConfig, getEventsIn, getMethodsConfig, getRpcOut, getEventsOut}) {
  var CONSOLE = getConsole(serviceName, serviceId, PACKAGE)
  try {
    checkRequired({getEventsIn, getMethodsConfig, getNetConfig, getRpcOut, getEventsOut}, PACKAGE)
    var getChannel = (channelName) => require(`./channels/${channelName}.client`)({getConsole, serviceName, serviceId})

    const getEventsFromServices = async (event, eventOutConfig) => {
      var servicesEventsIn = await getEventsIn('*')
      CONSOLE.debug('getEventsFromServices servicesEventsIn', servicesEventsIn, event)
      var eventConfig = []
      servicesEventsIn.forEach(config => {
        Object.keys(config.items).forEach(eventName => {
          if (event === eventName)eventConfig.push({to: config.service, method: config.items[eventName].method, event: config.items[eventName], eventName})
        })
      })
      CONSOLE.debug('getEventsFromServices ', eventConfig)
      return eventConfig
    }
    const getEventOutConfig = async (event) => {
      var eventsOutConfigAll = await getEventsOut()
      if (!eventsOutConfigAll[event]) {
        // CONSOLE.warn(`event ${event} not found in config EventsOut`, eventsOutConfigAll)
        throw new Error(`event ${event} not found in config EventsOut`)
        return null
      }
      return eventsOutConfigAll[event]
    }

    async function emit (event, data = {}, metaRaw = {}, timeout = false, channel = false) {
      try {
        checkRequired({event}, PACKAGE)
        var meta = Object.assign({}, metaRaw, { emit: event })
        var eventOutConfig = await getEventOutConfig(event)
        var eventsInConfig = await getEventsFromServices(event, eventOutConfig)
        CONSOLE.debug('emit start ' + event, { event, eventOutConfig, eventsInConfig })
        var responses = await Promise.all(eventsInConfig.map((rpcConfig) => rpcCall({ to: rpcConfig.to, method: rpcConfig.method, data, meta, timeout, log: false, channel })))
        responses = responses.filter((response) => response !== null)
        if (!eventOutConfig.multipleResponse)responses = responses[0] || null
        CONSOLE.debug('emit response ' + event, {responses, event, eventsInConfig})
        return responses
      } catch (error) {
        CONSOLE.debug('RPC error -->', error)
        return {error: 'emit error -->' + error}
      }
    }

    async function testLocalMethod (method, data = {}, meta = {}, timeout = false, channel = false) {
      return await rpcCall({to: serviceName, method, data, meta, timeout, channel})
    }

    async function rpc (rpcName, data = {}, meta = {}, timeout = false, channel = false) {
      checkRequired({rpcName}, PACKAGE)
      var rpcOutConfigAll = await getRpcOut()
      var rpcOutConfig = rpcOutConfigAll[rpcName]
      CONSOLE.debug('rpc() start', { rpcName, rpcOutConfig, rpcOutConfigAll })
      checkRequired({rpcOutConfig}, PACKAGE)
      if (rpcOutConfig.timeout)timeout = rpcOutConfig.timeout
      return await rpcCall({to: rpcOutConfig.to, method: rpcOutConfig.method, data, meta, timeout, channel})
    }

    function findChannel (from, to, senderNetConfig, listenerNetConfig) {
      var commonChannels = Object.keys(senderNetConfig.channels).filter((value) => 1 + Object.keys(listenerNetConfig.channels).indexOf(value))
      CONSOLE.debug('commonChannels', commonChannels, Object.keys(senderNetConfig.channels), Object.keys(listenerNetConfig.channels))
      if (!commonChannels.length) throw new Error(`service ${to} and service ${from} have no common channels`)
      commonChannels.sort((a, b) => preferedChannels.indexOf(b) - preferedChannels.indexOf(a))// listenerMethod preferedChannels
      CONSOLE.debug('rpc commonChannels', {commonChannels, first: commonChannels[0]})
      return commonChannels[0] || false
    }

    async function getMethodConfig (service, method) {
      var listenerMethodsConfig = await getMethodsConfig(service)
      if (!listenerMethodsConfig[method]) throw new Error(method + ' is not valid method(not defined in listener methods config)')
      return listenerMethodsConfig[method]
    }

    function getMessageMeta (metaRaw = {}, channel, stream = false, to) {
      return Object.assign({}, metaRaw, {
        corrid: metaRaw.corrid || uuidV4(),
        // userid: metaRaw.userid || 'UNKNOW',
        from: serviceName,
        timestamp: Date.now(),
        reqtype: 'out',
        channel: channel || 'UNKNOW',
        stream: stream,
        to: to
      })
    }

    async function rpcCall ({to, method, data = {}, meta = {}, timeout = false, channel = false }) {
      try {
        CONSOLE.debug('rpcCall() start', { to, method, data, meta, timeout, channel })
        checkRequired({to, method}, PACKAGE)

        // CONFIG
        var listenerMethodConfig = await getMethodConfig(to, method)
        var listenerNetConfig = await getNetConfig(to)

        // GET CHANNEL OBJ
        if (!channel) {
          var senderNetConfig = await getNetConfig(serviceName)
          channel = findChannel(serviceName, to, senderNetConfig, listenerNetConfig)
        }
        var channelObj = getChannel(channel)

        // SEND
        var message = { method, meta: getMessageMeta(meta, channel, isStream, to), data }
        var sendTo = listenerNetConfig.channels[channel]
        var waitResponse = (listenerMethodConfig.responseType !== 'noResponse')
        var isStream = (listenerMethodConfig.responseType === 'stream')

        timeout = timeout || listenerMethodConfig.timeout || 10000

        CONSOLE.log('=> CLIENT OUT ', {sendTo, message, timeout, waitResponse, isStream})
        var response = await channelObj.send(sendTo, message, timeout, waitResponse, isStream)
        CONSOLE.log('=> CLIENT IN  RESPONSE', {message, response})
        return response
      } catch (error) {
        CONSOLE.debug('RPC error -->', error)
        return {error: 'RPC error -->' + error}
      }
    }
    return {
      rpc, emit, testLocalMethod,rpcCall
    }
  } catch (error) {
    CONSOLE.error(error.toString(), {serviceName, serviceId, getNetConfig, getEventsIn, getMethodsConfig, getRpcOut, getEventsOut})
    throw new Error('Error during getNetClientPackage')
  }
}
