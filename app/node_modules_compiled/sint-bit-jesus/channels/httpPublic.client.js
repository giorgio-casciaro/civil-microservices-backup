var request = require('request')
const PACKAGE = 'channel.httpPublic.client'
const checkRequired = require('../utils').checkRequired
const EventEmitter = require('events')

module.exports = function getChannelHttpPublicClientPackage ({ getConsole, methodCall, serviceName = 'unknow', serviceId = 'unknow' }) {
  var CONSOLE = getConsole(serviceName, serviceId, PACKAGE)

  try {
    checkRequired({ getConsole})
    return {
      send (listener, message, timeout = 120000, waitResponse = true, isStream = false) {
        return new Promise((resolve, reject) => {
          var newMeta = {}
          for (var metaK in message.meta)newMeta['app-meta-' + metaK] = message.meta[metaK]
          newMeta['app-meta-stream'] = isStream
          var httpUrl = 'http://' + listener.url.replace('http://', '').replace('//', '')
          CONSOLE.debug('send:', JSON.stringify({ listener, message, timeout, waitResponse, isStream }))
          var callTimeout, call
          if (isStream) {
            call = request(
              { method: 'POST',
                preambleCRLF: true,
                postambleCRLF: true,
                body: message.data,
                headers: newMeta,
                json: true,
                uri: httpUrl + '/' + message.method
              })
            // stream serializer
            // console.log(call.listeners('data'))
            var rectifiedCall = new EventEmitter()
            call.on('data', (data) => {
              rectifiedCall.emit('data', JSON.parse(data))
            })
            call.on('error', (data) => rectifiedCall.emit('error', data))
            call.on('end', (data) => rectifiedCall.emit('end', data))
            resolve(rectifiedCall)
          } else {
            call = request(
              { method: 'POST',
                preambleCRLF: true,
                postambleCRLF: true,
                body: message.data,
                headers: newMeta,
                json: true,
                uri: httpUrl + '/' + message.method
              },
              function (error, response, body) {
                CONSOLE.debug('Http request response', {error, response, body})
                if (callTimeout)clearTimeout(callTimeout)
                if (error) return reject(error)
                if (waitResponse)resolve(body)
              })
            callTimeout = setTimeout(() => {
              call.end()
              CONSOLE.warn('sendMessage timeout  to ' + listener.url, { message, serviceName, timeout })
              if (waitResponse)reject('Response problems: REQUEST TIMEOUT')
              else resolve(null)
            }, timeout)
          }
          if (!waitResponse)resolve(null)
        })
      }
    }
  } catch (error) {
    CONSOLE.error(error, {getConsole, methodCall})
    throw new Error('Error during getChannelGrpcClientPackage')
  }
}
