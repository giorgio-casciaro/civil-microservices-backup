const CONFIG = {
  apiUrl: 'https://192.168.33.100:6443',
  elasticsearchHost: '192.168.33.100:81',
  updateEveryMsec: 1000,
  sendQueueEveryMsec: 1000
}

var K8s = require('k8s')
var cache = require('memory-cache')
var fs = require('fs')
var logTypes = require('./config/logTypes')
var nodeGrok = require('node-grok')
var patterns = nodeGrok.loadDefaultSync()
// patterns.loadSync('grokPatterns')
var elasticsearch = require('elasticsearch')
var elasticsearchClient = new elasticsearch.Client({
  host: CONFIG.elasticsearchHost,
  log: 'error'
})
var kubeapi = K8s.api({
  // 'auth': {
  //   'clientKey': fs.readFileSync('./pki/apiserver-key.pem'),
  //   'clientCert': fs.readFileSync('./pki/apiserver-pub.pem'),
  //   'caCert': fs.readFileSync('./pki/apiserver.pem')
  // },
  // 'auth': {
  //   'clientKey': fs.readFileSync('./pki/ca-key.pem'),
  //   'clientCert': fs.readFileSync('./pki/ca-pub.pem'),
  //   'caCert': fs.readFileSync('./pki/ca.pem')
  // },
  'auth': {
    'token': 'b6bc83b6a136e3cf'
  },
  strictSSL: false,
  endpoint: CONFIG.apiUrl,
  version: '/api/v1'
})
console.log(kubeapi)

var logs = []

/**
 * QUEUE - send queue to  elasticsearch
 */
function outputQueue () {
  if (logs && logs.length) {
    var sendLogs = logs
    logs = []
    console.log(`outputQueue --> ${sendLogs.length} LOGS`)
    elasticsearchClient.bulk({ body: sendLogs, index: 'logme-logs', type: 'log' }, function (err, resp) {
      if (err)console.error('elasticsearchClient.bulk', err)
      console.log('elasticsearchClient.bulk', resp)
    })
  } else console.log('outputQueue --> NO LOG')
}

/**
 * QUEUE - add to queue
 * @param {Object} log log strutturato
 */
function addToQueue (log) {
  logs.push({ index: { } })
  logs.push(log)
}

/**
 * QUEUE - start to send logs to output
 */
function startQueueLoop () {
  setInterval(outputQueue, CONFIG.sendQueueEveryMsec)
}

/**
 * LOG PARSE - parse and filter a single log
 * @param  {String} singleLog   log string
 * @param  {Array} podPatterns patterns to try es. ['APACHE','BASE','NGINX']
 */
function parseLogsBasedOnPodPatterns (singleLog, podPatterns) {
  console.log('parseLogsBasedOnPodPatterns', singleLog, podPatterns[0])
  if (podPatterns[0]) {
    var pattern = cache.get(podPatterns[0])
    if (pattern === null && logTypes[podPatterns[0]]) pattern = cache.put(podPatterns[0], patterns.createPattern(logTypes[podPatterns[0]].grok), 5000)
    if (pattern !== null) {
      pattern.parse(singleLog, function (err, obj) {
        if (err)console.error('parseLogsBasedOnPodPatterns', err)
        if (!obj) return parseLogsBasedOnPodPatterns(singleLog, podPatterns.slice(1))
        if (logTypes[podPatterns[0]].filter)obj = logTypes[podPatterns[0]].filter(obj)
        addToQueue(obj)
      })
    } else {
      parseLogsBasedOnPodPatterns(singleLog, podPatterns.slice(1))
    }
  }
}
/**
 * LOGS SPLIT - parse multiline logs
 * @param  {String} logString multiline logs string
 * @param  {Object} pod       pod object from kubeapi
 */
function parseLogs (logString, pod) {
  console.log('parseLogs', logString)
  var podPatterns = pod.metadata.labels.logMe.split('_')
  // console.log('parseLogs', logString.split('\n'))
  var logs = logString.split('\n')
  logs.forEach((singleLog) => {
    console.log('singleLog', singleLog)
    parseLogsBasedOnPodPatterns(singleLog, podPatterns)
  })
}
/**
 * LOGS GET FROM KUBEAPI - request pods from kubeapi based on label logMe and loop on pod's containers for logs
 * @param  {Number} [fromTimestamp=0]       timestamp
 * @param  {String} [labelSelector='logMe'] kubernetes label
 */
function parsePodsLogs (fromTimestamp = 0, labelSelector = 'logMe') {
  kubeapi.get(`pods/?labelSelector=${labelSelector}`, function (err, data) {
    if (err)console.error('parsePodsLogs', err)
    if (!data.items) return console.log('parsePodsLogs --> NO LOG')
    data.items.forEach((pod) => {
      pod.spec.containers.forEach((container) => {
        kubeapi.log(`namespaces/${pod.metadata.namespace}/pods/${pod.metadata.name}/log?container=${container.name}&sinceTime=${fromTimestamp}`, function (err, data) {
          if (!err && data !== '') {
            console.log(`parsePodsLogs --> ${pod.metadata.name} ${container.name} HAVE LOGS ${data.length}`)
            parseLogs(data, pod)
          } else console.log(`parsePodsLogs --> ${pod.metadata.name} ${container.name} NO LOG`)
        })
      })
    })
  })
}

function getLastTimestamp () {
  try {
    return fs.readFileSync('_lastTimestamp.txt', 'utf-8')
  } catch (error) {
    return new Date(0).toISOString()
  }
}
function setLastTimestamp (timestamp) {
  fs.writeFileSync('_lastTimestamp.txt', timestamp, 'utf-8')
}
function startParseLoop () {
  console.log('startParseLoop')
  setInterval(function () {
    parsePodsLogs(getLastTimestamp())
    setLastTimestamp(new Date().toISOString())
  }, CONFIG.updateEveryMsec)
}

startParseLoop()
startQueueLoop()
