const PACKAGE = 'net.client'
const checkRequired = require('./utils').checkRequired
const R = require('ramda')
var preferedChannels = ['grpc', 'zeromq', 'http']
// var delayedMessages = global.JESUS_NET_CLIENT_delayedMessages = global.JESUS_NET_CLIENT_delayedMessages || {}
const getConsole = (serviceName, serviceId, pack) => require('./utils').getConsole({error: true, debug: true, log: true, warn: true}, serviceName, serviceId, pack)

module.exports = function getNetClientPackage ({serviceName = 'unknow', serviceId = 'unknow', getNetConfig, getEventsIn, getMethodsConfig, getRpcOut, getEventsOut}) {
  var CONSOLE = getConsole(serviceName, serviceId, PACKAGE)
  try {
    checkRequired({getEventsIn, getMethodsConfig, getNetConfig, getRpcOut, getEventsOut}, PACKAGE)
    var getChannel = (channelName) => require(`./channels/${channelName}.client`)({getConsole, serviceName, serviceId})

    const getEventsFromServices = async (event) => {
      var servicesEventsIn = await getEventsIn('*', serviceName)
      CONSOLE.debug('getEventsFromServices servicesEventsIn', servicesEventsIn, event)
      var eventConfig = []
      servicesEventsIn.forEach(config => {
        Object.keys(config.items).forEach(eventName => {
          if (event === eventName || eventName === '*')eventConfig.push({to: config.service, method: config.items[eventName].method, event: config.items[eventName], eventName})
        })
      })
      CONSOLE.debug('getEventsFromServices ', eventConfig)
      return eventConfig
    }

    async function emit (event, data = {}, meta = {}, timeout = 5000) {
      checkRequired({event}, PACKAGE)
      meta.event = event
      var eventsOutConfigAll = await getEventsOut()
      if(!eventsOutConfigAll[event]){
        CONSOLE.warn(`event ${event} not found in config EventsOut`, eventsOutConfigAll)
        return null
      }
      var eventOutConfig = eventsOutConfigAll[event]
      var eventsInConfig = await getEventsFromServices(event)
      CONSOLE.debug('emit start ' + event, { eventsOutConfigAll,eventOutConfig,eventsInConfig, event, data, meta, timeout })
      checkRequired({eventOutConfig}, PACKAGE)
      var responses = await Promise.all(eventsInConfig.map((rpcConfig) => rpcCall({ to: rpcConfig.to, method: rpcConfig.method, data, meta, timeout, log: false })))
      responses = responses.filter((response) => response !== null)
      if (!eventOutConfig.multipleResponse)responses = responses[0] || null
      CONSOLE.debug('emit response ' + event, {responses, event, eventsInConfig})
      return responses
    }
    async function rpc (rpcName, data = {}, meta = {}, timeout = 5000) {
      checkRequired({rpcName}, PACKAGE)
      var rpcOutConfigAll = await getRpcOut()
      var rpcOutConfig = rpcOutConfigAll[rpcName]
      CONSOLE.debug('rpc() start', { rpcName, rpcOutConfig, rpcOutConfigAll})
      checkRequired({rpcOutConfig}, PACKAGE)
      if (rpcOutConfig.timeout)timeout = rpcOutConfig.timeout
      return await rpcCall({to: rpcOutConfig.to, method: rpcOutConfig.method, data, meta, timeout })
    }
    async function rpcCall ({to, method, data = {}, meta = {}, timeout = 5000 }) {
      //
      try {
        checkRequired({to, method}, PACKAGE)
        var senderNetConfig = await getNetConfig(serviceName)
        var listenerNetConfig = await getNetConfig(to)
        var listenerMethodsConfig = await getMethodsConfig(to)
        var listenerMethodConfig = listenerMethodsConfig[method]

        CONSOLE.debug('rpcCall() start', { to, method, data, meta, timeout, listenerNetConfig })
        CONSOLE.debug('rpcCall() start', to,listenerMethodsConfig)
        if (!listenerMethodsConfig[method]) throw new Error(method + ' is not valid (not defined in listener methods config)')

        var commonChannels = Object.keys(senderNetConfig.channels).filter((value) => 1 + Object.keys(listenerNetConfig.channels).indexOf(value))
        CONSOLE.debug('commonChannels', commonChannels, Object.keys(senderNetConfig.channels), Object.keys(listenerNetConfig.channels))
        if (!commonChannels.length) throw new Error(`service ${to} and service ${serviceName} have no common channels`)
        commonChannels.sort((a, b) => preferedChannels.indexOf(b) - preferedChannels.indexOf(a))// listenerMethod preferedChannels

        CONSOLE.debug('rpc commonChannels', {commonChannels, first: commonChannels[0]})
        var channel = getChannel(commonChannels[0])

        var sendTo = listenerNetConfig.channels[commonChannels[0]]
        var waitResponse = (listenerMethodConfig.responseType !== 'noResponse')
        var isStream = (listenerMethodConfig.responseType === 'stream')
        meta = R.merge({
          reqOutTimestamp: Date.now(),
          from: serviceName,
          stream: isStream,
          to
        }, meta)
        var message = {method, meta, data}

          // if streaming return eventEmiter con on data,on error,on end altrimenti risposta
        CONSOLE.debug('=> CLIENT OUT ', {to: sendTo, message, waitResponse})
        var response = await channel.send(sendTo, message, listenerMethodConfig.timeout, waitResponse, isStream)
        CONSOLE.debug('=> CLIENT IN  RESPONSE', {response})
          // if (singleResponse && response && response[0])response = response[0]
        CONSOLE.debug('rpc to ' + to + ' ' + method + ' corrid:' + meta.corrid, {response, sendTo, message, waitResponse})
        return response
      } catch (error) {
        CONSOLE.error(error, {to, method, data, meta, timeout})
        throw new Error('Error during rpc')
      }
    }
    return {
      rpc, emit
    }
  } catch (error) {
    CONSOLE.error(error, {serviceName , serviceId , getNetConfig, getEventsIn, getMethodsConfig, getRpcOut, getEventsOut})
    throw new Error('Error during getNetClientPackage')
  }
}
