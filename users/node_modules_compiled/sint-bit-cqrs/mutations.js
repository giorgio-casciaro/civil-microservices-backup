var R = require('ramda')
var path = require('path')

var fs = require('fs')
const PACKAGE = 'mutations.cqrs'
const checkRequired = require('./utils').checkRequired
var checkRequiredFiles = require('./utils').checkRequiredFiles
const uuidV4 = require('uuid/v4')
const getConsole = (serviceName, serviceId, pack) => require('./utils').getConsole({error: true, debug: true, log: true, warn: true}, serviceName, serviceId, pack)

function getMutationsFunctions (basePath) {
  var filesJsNoExtension = R.map(R.compose(R.replace('.js', ''), path.basename), R.filter((file) => path.extname(file) === '.js', fs.readdirSync(basePath)))
  var splitFiles = R.map(R.split('.'))
  var sortFiles = R.compose(R.reverse, R.sortBy(R.compose(parseInt, R.prop(0))))
  var groupFiles = R.groupBy(R.prop(0))
  var addFunction = R.map(R.map((element) => {
    return {mutationId: element[0], mutationVersion: element[1]}
  }))
  var mutationsFunctions = R.compose(addFunction, groupFiles, sortFiles, splitFiles)(filesJsNoExtension)
  // debug('getMutationsFunctions', mutationsFunctions)
  return mutationsFunctions
}

function checkMutationFunction (mutationId, mutationsFunctions) {
  if (!mutationsFunctions[mutationId] || !mutationsFunctions[mutationId][0]) {
    errorThrow('mutation not defined', {mutationId})
  }
}

function generateId () { return uuidV4() }
module.exports = function getMutationsCqrsPackage ({serviceName = 'unknow', serviceId = 'unknow', mutationsPath}) {
  var CONSOLE = getConsole(serviceName, serviceId, PACKAGE)
  var errorThrow = require('./utils').errorThrow(serviceName, serviceId, PACKAGE)

  var applyMutationsFromPath = function applyMutationsFromPathFunc (originalState, mutations, mutationsPath) {
    var state = R.clone(originalState)
    CONSOLE.debug('applyMutationsFromPath', {state, mutations, mutationsPath})
    function applyMutation (state, mutation) {
      var mutationFile = path.join(mutationsPath, `${mutation.mutation}.${mutation.version}.js`)
      CONSOLE.debug('applyMutation', {mutationFile, state, data: mutation.data})
      return require(mutationFile)(state, mutation.data)
    }
    return R.reduce(applyMutation, state, mutations)
  }

  try {
    checkRequired({mutationsPath}, PACKAGE)
    checkRequiredFiles([mutationsPath], PACKAGE)
    return {
      mutate: function mutate ({mutation, objId, data, meta}) {
        try {
          checkRequired({meta, data, objId, mutation}, PACKAGE)
          var mutationsFunctions = getMutationsFunctions(mutationsPath)
          checkMutationFunction(mutation, mutationsFunctions)
          var lastMutationVersion = mutationsFunctions[mutation][0].mutationVersion
          var mutationState = {
            objId: objId,
            id: generateId(),
            mutation,
            meta,
            version: lastMutationVersion,
            timestamp: new Date().getTime(),
            data
          }
          CONSOLE.debug('dataSingleMutation to create', {mutation, lastMutationVersion, objId, data, mutationState})
          return mutationState
        } catch (error) {
          errorThrow('mutate(args) Error', {error, mutation, objId, data})
        }
      },
      applyMutations: function applyMutations (state, mutations) {
        CONSOLE.debug('applyMutationsFromPath', {state, mutations, mutationsPath})
        return applyMutationsFromPath(state, mutations, mutationsPath)
      }
    }
  } catch (error) {
    errorThrow('getMutationsCqrsPackage', {error, mutationsPath})
  }
}
