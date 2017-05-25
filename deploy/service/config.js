var path = require('path')
module.exports = {
  service: {
    serviceName: process.env.serviceName || 'deploy',
    schemaPath: path.join(__dirname, '../../sharedSchema/')
  },
  schemaHost: process.env.schemaHost || 'http://127.0.0.1:10000',
  // net: {
  //   'channels': {
  //     'httpPublic': {
  //       'url': `${process.env.netHost || '127.0.0.1'}:${process.env.netHostHttpPublicPort || '10080'}`,
  //       'cors': process.env.netCors || process.env.netHost || '127.0.0.1'
  //     },
  //     'http': { 'url': `${process.env.netHost || '127.0.0.1'}:${process.env.netHostHttpPort || '10081'}` }
  //   }
  // },
  console: { error: process.env.consoleError || true, debug: process.env.consoleDebug || true, log: process.env.consoleLog || true, warn: process.env.consoleWarn || true }
}
