var R = require('ramda')

var shorthash = require('shorthash').unique
// var path = require('path')
// var fs = require('fs')
// var jesus = require('./jesus')
const PACKAGE = 'views.cqrs'
const checkRequired = require('./utils').checkRequired
const getConsole = (serviceName, serviceId, pack) => require('./utils').getConsole({error: true, debug: true, log: true, warn: true}, serviceName, serviceId, pack)

module.exports = function getViewsCqrsPackage ({ serviceName = 'unknow', serviceId = 'unknow', snapshotsMaxMutations = 10 }) {
  var CONSOLE = getConsole(serviceName, serviceId, PACKAGE)
  var errorThrow = require('./utils').errorThrow(serviceName, serviceId, PACKAGE)
  // getObjMutations, applyMutations
  try {
    var updateView = async function ({objId, lastSnapshot = {timestamp: 0, state: {}}, loadMutations = true, addMutations = [], getObjMutations,applyMutations}) {
      try {
        checkRequired({getObjMutations,applyMutations})
        // COLLECT MUTATIONS AND UPDATE VIEW
        CONSOLE.debug('updateView', {objId, lastSnapshot, loadMutations, addMutations})
        var mutations = []
        if (loadMutations)mutations = await getObjMutations({objId, minTimestamp: lastSnapshot.timestamp})
        CONSOLE.debug('loaded Mutations', { mutations })
        mutations = mutations.concat(addMutations)
        CONSOLE.debug('total Mutations', { mutations })
        mutations = R.uniqBy(R.prop('id'), mutations)
        CONSOLE.debug('filtered Mutations', { mutations })
        var updatedView = await applyMutations({ state: lastSnapshot.state, mutations })

        // VIEW META DATA _view
        if (updatedView._viewBuilded) delete updatedView._viewBuilded
        if (updatedView._viewHash) delete updatedView._viewHash
        updatedView._viewHash = shorthash(JSON.stringify(updatedView))
        updatedView._viewBuilded = Date.now()

        // NEW SNAPSHOT
        var newSnapshot = false
        if (snapshotsMaxMutations < mutations && mutations.length) newSnapshot = {timestamp: Date.now(), state: updatedView} // update snapshot if required

        CONSOLE.debug('updatedView', {updatedView, mutations})
        return {updatedView, newSnapshot}
      } catch (error) {
        CONSOLE.error(error)
        throw new Error(PACKAGE + ` updateView`)
      }
    }
    return {
      refreshViews: function refreshViews ({objIds, loadMutations, addMutations }) {
        CONSOLE.debug('refreshsViews', {objIds, addMutations })
        function singleView (objId) {
          return updateView({objId, loadMutations, addMutations})
        }
        return Promise.all(R.map(singleView, objIds))
      }
    }
  } catch (error) {
    errorThrow(`getViewsCqrsPackage()`, {error})
  }
}
