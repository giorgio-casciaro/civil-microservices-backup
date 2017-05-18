var path = require('path')
var fs = require('fs')
module.exports = {
  service: {
    serviceName: process.env.serviceName || 'users',
    schemaPath: path.join(__dirname, '../../sharedSchema/')
  },
  confirmEmailUrl: process.env.confirmEmailUrl || 'http://127.0.0.1:18080/#/confirmEmailUrl',
  sendEmails: process.env.sendEmails || true,
  mailFrom: process.env.mailFrom || 'notifications@civilconnect.it',
  smtp: process.env.smtpConfigJson ? JSON.parse(process.env.smtpConfigJson) : {
    host: '127.0.0.1',
    port: 1025,
    secure: false,
    debug: true
  },
  net: {
    'channels': {
      'httpPublic': {
        'url': `${process.env.netHost || '127.0.0.1'}:${process.env.netHostHttpPublicPort || '18080'}`,
        'cors': process.env.netCors || process.env.netHost || '127.0.0.1'
      },
      'http': { 'url': `${process.env.netHost || '127.0.0.1'}:${process.env.netHostHttpPort || '18081'}` }
    }
  },
  jwt: {
    // 'passphrase': process.env.jwtPassphrase || 'CJhbGciOiJIUzI1NiJ9eyJ0eXAiOiJKV1QiL',
    'path': path.join(__dirname, './permissions/'),
    'privateCert': process.env.jwtPrivateCert || fs.readFileSync(path.join(__dirname, './server.key')),
    'publicCert': process.env.jwtPublicCert || fs.readFileSync(path.join(__dirname, './server.cert'))
  },
  aerospike: {
    hosts: process.env.aerospikeHosts || '127.0.0.1:3000',
    // log: {level: process.env.aerospikeLogLevel || 4},
    set: process.env.aerospikeSet || 'test',
    mutationsSet: process.env.aerospikeMutationsSet || 'mutationsTest',
    viewsSet: process.env.aerospikeViewsSet || 'viewsTest',
    namespace: process.env.aerospikeNamespace || 'civilconnect',
    policies: { timeout: 10000 }
  },
  console: { error: process.env.consoleError || true, debug: process.env.consoleDebug || true, log: process.env.consoleLog || true, warn: process.env.consoleWarn || true }
}
