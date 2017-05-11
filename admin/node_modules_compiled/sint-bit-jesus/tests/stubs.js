module.exports = function (sharedConfig, Methods, getConsole) {
  var getMethods = (service, exclude) => Methods

  var getSharedConfig = (field = 'net', service = '*', exclude = '') => {
    console.log()
    if (service === '*') return Object.keys(sharedConfig).filter((key) => key !== exclude).map((key) => { return {items: sharedConfig[key][field], service: key} })
    else return sharedConfig[service][field]
  }

  function getServer (serviceName, serviceId) {
    var getMethodsConfig = async (service, exclude) => getSharedConfig('methods', service || serviceName, exclude)
    var getNetConfig = async (service, exclude) => getSharedConfig('net', service || serviceName, exclude)
    var getEventsIn = async (service, exclude) => getSharedConfig('eventsIn', service || serviceName, exclude)
    var getEventsOut = async (service, exclude) => getSharedConfig('eventsOut', service || serviceName, exclude)
    var getRpcOut = async (service, exclude) => getSharedConfig('rpcOut', service || serviceName, exclude)
    return require('../net.server')({getConsole, serviceName, serviceId, getMethods, getMethodsConfig, getNetConfig})
  }

  function getClient (serviceName, serviceId) {
    var getMethodsConfig = async (service, exclude) => getSharedConfig('methods', service || serviceName, exclude)
    var getNetConfig = async (service, exclude) => getSharedConfig('net', service || serviceName, exclude)
    var getEventsIn = async (service, exclude) => getSharedConfig('eventsIn', service || serviceName, exclude)
    var getEventsOut = async (service, exclude) => getSharedConfig('eventsOut', service || serviceName, exclude)
    var getRpcOut = async (service, exclude) => getSharedConfig('rpcOut', service || serviceName, exclude)
    return require('../net.client')({getConsole, serviceName, serviceId, getNetConfig, getEventsIn, getEventsOut, getMethodsConfig, getRpcOut})
  }

  return {
    getServer, getClient
  }
}
