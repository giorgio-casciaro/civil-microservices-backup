const PACKAGE = 'channel.test.server'
const checkRequired = require('../utils').checkRequired
const EventEmitter = require('events')
var globalEmitters = global.channelTestServers = global.channelTestServers || []

module.exports = function getChannelTestClientPackage ({ getConsole, serviceName = 'unknow', serviceId = 'unknow'}) {
  var CONSOLE = getConsole(serviceName, serviceId, PACKAGE)
  try {
    checkRequired({getConsole})
    return {
      send (listener, message, timeout = 120000, waitResponse = true, isStream = false) {
        var globalEmitter = globalEmitters[listener.url] = globalEmitters[listener.url] || new EventEmitter()
        CONSOLE.debug('send', {listener, message, timeout, waitResponse, isStream})
        return new Promise((resolve, reject) => {
          if (isStream) {
            globalEmitter.emit('messageStream', message, (stream) => resolve(stream))
          } else {
            globalEmitter.emit('message', message, (response) => resolve(response))
          }
          if (!waitResponse)resolve(null)
        })
      }
    }
  } catch (error) {
    CONSOLE.error(error, {getConsole})
    throw new Error('Error during getChannelTestClientPackage')
  }
}
