process.on('unhandledRejection', (err, p) => {
  console.log('An unhandledRejection occurred')
  console.log(`Rejected Promise: ${p}`)
  console.log(`Rejection: ${err}`)
})
const fs = require('fs')
const path = require('path')
var exec = require('child_process').execSync
var hashFiles = require('hash-files')
var nedbPromise = require('nedb-promise')
const DB = nedbPromise.datastore({
  filename: 'db.json',
  autoload: true
})

function getDirectories (srcpath) {
  return fs.readdirSync(srcpath).filter(file => fs.lstatSync(path.join(srcpath, file)).isDirectory())
}
async function getServicesInfo () {
  var servicesInfo = await DB.findOne({_id: 'servicesInfo'})
  return getDirectories(path.join(__dirname, '/mount')).map((service) => {
    var srvPath = path.join(__dirname, '/mount/', service)
    var hash = hashFiles.sync({'files': srvPath + '/**'})
    return {
      name: service,
      path: srvPath,
      npm: fs.lstatSync(path.join(srvPath, '/package.json')).isFile(),
      docker: fs.lstatSync(path.join(srvPath, '/docker')).isDirectory(),
      haveUpdates: !(servicesInfo && servicesInfo.info && servicesInfo.info[service] && servicesInfo.info[service].hash === hash),
      hash
    }
  })
}
async function updateServicesInfo () {
  var servicesInfo = await getServicesInfo()
  var toDb = {}
  servicesInfo.forEach((service) => (toDb[service.name] = service))
  await DB.insert([{_id: 'servicesInfo', info: toDb}])
}
function build (srv) {
  console.log(`Compiling ${srv.name}`)
  var out = exec('npm run compile_modules', {cwd: srv.path, encoding: 'utf-8', timeout: 1000*60*60})
  console.log(`Building ${srv.name}`)
  out += exec('npm run build', {cwd: srv.path, encoding: 'utf-8', timeout: 1000*60*60})
  return out
}

var service = async function getMethods (CONSOLE, netClient, CONFIG = require('./config'), schemaClient) {
  try {
    CONSOLE.debug('CONFIG', CONFIG)
    return {
      async analizeDev (reqData, meta = {directCall: true}, getStream = null) {
        // var hash = hashFiles.sync({'files': __dirname + '/mount'})
        // await DB.update({_id: 'hash'}, { _id: 'hash', hash }, { upsert: true })
        // let document = await DB.findOne({_id: 'hash'})
        // var services = getDirectories(path.join(__dirname, '/mount'))
        // var services = services.map((service) => {
        //   var srvPath = path.join(__dirname, '/mount/', service)
        //   return {
        //     service,
        //     hash: hashFiles.sync({'files': srvPath + '/**'})
        //   }
        // })
        var services = await getServicesInfo()
        var servicesBuilds = await Promise.all(services.filter((srv) => srv.haveUpdates).map(build))
        return { services, servicesBuilds}
      }
    }
  } catch (error) {
    CONSOLE.error('getMethods', error)
    return { error: 'getMethods error' }
  }
}

module.exports = service
