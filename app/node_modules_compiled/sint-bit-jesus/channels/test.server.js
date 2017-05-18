const PACKAGE = 'channel.test.server'
const checkRequired = require('../utils').checkRequired
const EventEmitter = require('events')
var globalEmitters = global.channelTestServers = global.channelTestServers || []
const publicApi = true
module.exports = function getChannelGrpcServerPackage ({serialize, deserialize, getConsole, methodCall, serviceName = 'unknow', serviceId = 'unknow', config}) {
  var CONSOLE = getConsole(serviceName, serviceId, PACKAGE)
  try {
    function start () {
      var globalEmitter = globalEmitters[config.url] = globalEmitters[config.url] || new EventEmitter()
      globalEmitter.on('message', async function (message, respond) {
        var response = await methodCall(message, false, publicApi, 'test')
        respond(response)
      })
      globalEmitter.on('messageStream', async function (message, respond) {
        var stream = {
          write: (data) => readableStream.emit('data', data),
          end: () => readableStream.emit('end')
        }
        var readableStream = new EventEmitter()
        readableStream._read = function (size) { /* do nothing */ }

        var getStream = (onClose, MAX_REQUEST_TIMEOUT = 120000) => {
          const close = () => { readableStream.end(); if (timeout)clearTimeout(timeout); onClose() }
          var timeout = setTimeout(close, MAX_REQUEST_TIMEOUT)
          return stream
        }
        methodCall(message, getStream, publicApi, 'test')
        respond(readableStream)
      })
      CONSOLE.debug('Net started TEST channel')
    }
    checkRequired({config, methodCall, getConsole})
    return {
      start,
      stop () {},
      restart () {}
    }
  } catch (error) {
    CONSOLE.error(error, {config})
    throw new Error('getChannelGrpcServerPackage ' + config.url)
  }
}
