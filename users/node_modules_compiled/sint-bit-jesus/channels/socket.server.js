var express = require('express')
var bodyParser = require('body-parser')
var compression = require('compression')
var fs = require('fs')
var helmet = require('helmet')
const url = require('url')
const PACKAGE = 'channel.http.server'
const checkRequired = require('../utils').checkRequired
const publicApi = false
var httpApi
var httpServer

module.exports = function getChannelHttpServerPackage ({getConsole, methodCall, serviceName = 'unknow', serviceId = 'unknow', config}) {
  var CONSOLE = getConsole(serviceName, serviceId, PACKAGE)
  try {
    checkRequired({config, methodCall, getConsole})
    async function start () {
      var socketFile = config.file.replace(':', '')
      if (fs.existsSync(socketFile))fs.unlinkSync(socketFile)
      // var httpUrl = 'http://' + config.file.replace('http://', '').replace('//', '')
      // var httpPort = url.parse(httpUrl, false, true).port
      httpApi = express()
      httpApi.use(helmet())
      httpApi.use(compression({level: 1}))
      httpApi.use(bodyParser.json()) // support json encoded bodies
      httpApi.use(bodyParser.urlencoded({ extended: true })) // support encoded bodies
      httpApi.all('/_httpMessage', async (req, res) => {
        try {
          var data = req.body || req.query
          CONSOLE.debug('_httpMessage', req, data)
          var response = await methodCall(data, false, publicApi, 'socket')
          res.send(response)
        } catch (error) {
          CONSOLE.warn('Api error', {error})
          res.send({error})
        }
      })
      httpApi.all('/_httpMessageStream', async (req, res) => {
        try {
          var data = req.body || req.query
          CONSOLE.debug('_httpMessageStream', req, data)
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          })
          var getStream = (onClose, MAX_REQUEST_TIMEOUT = 120000) => {
            const close = () => { if (timeout)clearTimeout(timeout); onClose() }
            res.on('close', close).on('finish', close).on('error', close).on('end', close)
            var timeout = setTimeout(res.end, MAX_REQUEST_TIMEOUT)
            return {
              write: (obj) => res.write(JSON.stringify(obj)),
              end: (obj) => res.end()
            }
          }
          methodCall(data, getStream, publicApi, 'socket')
        } catch (error) {
          CONSOLE.warn('Api error', {error})
          res.send({error})
        }
      })

      httpServer = httpApi.listen(socketFile)
      CONSOLE.debug('http Api listening on ' + socketFile)
    }

    return {
      start,
      stop () {
        httpServer.close()
      },
      restart () {
        httpServer.close(start)
      }
    }
  } catch (error) {
    CONSOLE.error(error, {config})
    throw new Error('getChannelHttpServerPackage ' + config.file)
  }
}
