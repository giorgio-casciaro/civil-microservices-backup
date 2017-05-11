const R = require('ramda')
const fs = require('fs')
const path = require('path')
const PACKAGE = 'utils'

const stringToColor = (string) => {
  var value = string.split('').map((char) => char.charCodeAt(0) * 2).reduce((a, b) => a + b, 0)
  return `hsl(${(value) % 255},80%,30%)`
}
var getConsoleInitTime = Date.now()

function getConsole (config = {debug: false, log: true, error: true, warn: true}, serviceName, serviceId, pack, logDir = false) {
  var initTime = getConsoleInitTime
  return {
    profile (name) { if (!console.profile) return false; console.profile(name) },
    profileEnd (name) { if (!console.profile) return false; console.profileEnd(name) },
    error () { if (!config.error) return false; var args = Array.prototype.slice.call(arguments); args[0] = args[0].message || args[0]; console.error.apply(this, [serviceName, Date.now() - initTime, serviceId, pack].concat(args)); console.trace() },
    log () {
      if (!config.log) return false
      var args = Array.prototype.slice.call(arguments)
      console.log.apply(this, [serviceName, Date.now() - initTime, serviceId, pack].concat(args))
    },
    debug () { if (!config.debug || typeof (console.debug) !== 'function') return false; var args = Array.prototype.slice.call(arguments); console.debug.apply(this, ['%c' + serviceName, 'background: ' + stringToColor(serviceName) + '; color: white; display: block;', Date.now() - initTime, serviceId, pack].concat(args)) },
    warn () { if (!config.warn || !console.warn) return false; var args = Array.prototype.slice.call(arguments); console.warn.apply(this, [serviceName, Date.now() - initTime, serviceId, pack].concat(args)) }
  }
}
function errorThrow (serviceName, serviceId, pack) {
  return (msg, data) => {
    getConsole(false, serviceName, serviceId, pack).warn(msg, data)
    if (data && data.error) throw data.error
    else throw msg
  }
}

module.exports = {
  errorThrow,
  getConsole,
  checkRequired (PROPS_OBJ, PACKAGE) {
    var propsNames = Object.keys(PROPS_OBJ)
    propsNames.forEach((propName) => {
      if (!PROPS_OBJ[propName]) {
        throw `PACKAGE:${PACKAGE}  Required Dependency ${propName} is missing`
      }
    })
  },
  checkRequiredFiles (FILES, PACKAGE) {
    FILES.forEach((file) => {
      if (!fs.existsSync(file)) {
        throw `Required File ${file} is missing`
      }
    })
  },
  getAsPromise: function (value) {
    return new Promise((resolve, reject) => {
      Promise.resolve(value).then(function (value) {
        if (typeof (value) === 'function') {
          try { return resolve(value()) } catch (error) { return reject(error) }
        } else return resolve(value)
      })
    })
  },
  argsOverwrite () {
    var overwriteArgs = Array.prototype.slice.call(arguments, 1)
    var originalPackage = arguments[0]
    var modifiedPackage = {}
    for (var i in originalPackage) {
      modifiedPackage[i] = function packageArgsOverwrite () {
        var modifiedArguments = Object.assign(arguments, overwriteArgs)
        return originalPackage[i].apply(this, modifiedArguments)
      }
    }
    return modifiedPackage
  },
  isEmptyArray (array) {
    return (!array || !array.length)
  },
  addObjectColumn: function (objectsArray, columnName, valuesArray) {
    var addColums = (val, index) => R.merge({
      [columnName]: valuesArray[index]
    }, val)
    return R.addIndex(R.map)(addColums, objectsArray)
  }

}
