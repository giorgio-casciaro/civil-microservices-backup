var co = require('co')

module.exports = (CONSOLE, netClient) => {
  var testNoResponse = co.wrap(function* (data, meta, getStream) {
    CONSOLE.debug('testNoResponse', {data, meta})
  })
  var testAknowlegment = co.wrap(function* (data, meta, getStream) {
    CONSOLE.debug('testAknowlegment', {data, meta})
  })
  var testResponse = co.wrap(function* (data, meta, getStream) {
    CONSOLE.debug('testResponse', {data, meta})
    // TEST ASYNC CALL
    yield new Promise((resolve) => setTimeout(resolve, 1000))
    return data
  })
  var testStream = co.wrap(function* (data, meta, getStream) {
    CONSOLE.debug('testStream', {data, meta, getStream})
    var onClose = () => { CONSOLE.log('stream closed') }
    var stream = getStream(onClose, 120000)
    stream.write({testStreamConnnected: 1})
    setTimeout(() => stream.write({testStreamData: 1}), 500)
    setTimeout(() => stream.end(), 1000)
  })

  return {
    testNoResponse, testAknowlegment, testResponse, testStream
  }
}
