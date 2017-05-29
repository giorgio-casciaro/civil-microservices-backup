// const Aerospike = require('aerospike')
// const Key = Aerospike.Key
// const kvDb = require('./lib/kvDb')
const fs = require('fs')
const path = require('path')

const getConsole = (serviceName, serviceId, pack) => require('./lib/utils').getConsole({error: true, debug: true, log: true, warn: true}, serviceName, serviceId, pack)
var PACKAGE = 'deployMs'
var CONSOLE = getConsole(PACKAGE, '----', '-----')

const express = require('express')
const app = express()
var server = {}
const bodyParser = require('body-parser')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, '/public')))
const CONFIG = require('./config')

const yaml = require('js-yaml')

const exec = require('child_process').execSync
const hashFiles = require('hash-files')

const srvPath = (service) => path.join(CONFIG.mountPath, service)
const srvPathFile = (service, file) => path.join(CONFIG.mountPath, service, '/', file)
const isFile = file => fs.existsSync(file) && fs.lstatSync(file).isFile()
const isDirectory = file => fs.existsSync(file) && fs.lstatSync(file).isDirectory()
const getDirectories = (srcpath) => fs.readdirSync(srcpath).filter(file => fs.lstatSync(path.join(srcpath, file)).isDirectory())
const getFiles = (srcpath) => fs.readdirSync(srcpath).filter(file => isFile(path.join(srcpath, file)))
const getHash = srv => hashFiles.sync({'files': [srvPath(srv) + '/service/**', srvPath(srv) + '/kubernetes/**']})

function getServiceInfo (service) {
  var hash = getHash(service)
  var saved = getServiceData(service)
  return {
    dir: service,
    path: srvPath(service),
    saved,
    haveUpdates: !(saved && saved.hash === hash)
  }
}
async function getServicesInfo () {
  return getDirectories(CONFIG.mountPath)
  .filter(service => isFile(srvPathFile(service, '/service.name')))
  .map(getServiceInfo)
}
const updServiceData = (srv, info) => {
  info.hash = getHash(srv)
  info.version = parseInt(info.version || 0) + 1
  fs.writeFileSync(srvPathFile(srv, '/service.hash'), info.hash, 'utf-8')
  fs.writeFileSync(srvPathFile(srv, '/service.version'), info.version, 'utf-8')
}
const getServiceData = (srv) => {
  return {
    name: fs.readFileSync(srvPathFile(srv, '/service.name'), 'utf-8'),
    hash: isFile(srvPathFile(srv, '/service.hash')) ? fs.readFileSync(srvPathFile(srv, '/service.hash'), 'utf-8').trim() : '',
    version: isFile(srvPathFile(srv, '/service.version')) ? fs.readFileSync(srvPathFile(srv, '/service.version'), 'utf-8').trim() : 0,
    image: isFile(srvPathFile(srv, '/service.image')) ? fs.readFileSync(srvPathFile(srv, '/service.image'), 'utf-8').trim() : false
  }
}
const updateYaml = (srv, file, image, version) => {
  if (image && isFile(srvPathFile(srv, file))) {
    var kubeYaml = yaml.safeLoad(fs.readFileSync(srvPathFile(srv, file), 'utf8'))
    kubeYaml.spec.template.spec.containers[0].image = `${image}:version-${version}`
    fs.writeFileSync(srvPathFile(srv, file), yaml.safeDump(kubeYaml), 'utf8')
    return true
  }
  return false
}

function build (srv) {
  var out = {}
  try {
    var serviceInfo = getServiceInfo(srv)
    console.log(`Installing ${serviceInfo.saved.name}`, serviceInfo)
    if (isFile(srvPathFile(srv, 'package.json'))) {
      try {
        out.install = exec('npm install --production', {cwd: serviceInfo.path, encoding: 'utf-8', timeout: 1000 * 60 * 60})
      } catch (error) {
        console.log(error)
        out.installError = error
        return out
      }
    }
    console.log(`Compiling ${serviceInfo.saved.name}`, serviceInfo)
    if (isFile(srvPathFile(srv, '/docker/compile.sh'))) {
      try {
        out.compile = exec('sh compile.sh', {cwd: serviceInfo.path + '/docker/', encoding: 'utf-8', timeout: 1000 * 60 * 60})
      } catch (error) {
        console.log(error)
        out.compileError = error
        return out
      }
    }
    console.log(`Building ${serviceInfo.saved.name}`)
    if (isFile(srvPathFile(srv, '/docker/build.sh'))) {
      try {
        out.build = exec('sh build.sh', {cwd: serviceInfo.path + '/docker/', encoding: 'utf-8', timeout: 1000 * 60 * 60})
      } catch (error) {
        out.buildError = error
        return out
      }
    }
    console.log(`Pushing ${serviceInfo.saved.name}`)
    if (isFile(srvPathFile(srv, '/docker/push.sh'))) {
      try {
        out.push = exec('sh push.sh', {cwd: serviceInfo.path + '/docker/', encoding: 'utf-8', timeout: 1000 * 60 * 60})
      } catch (error) {
        out.pushError = error
        return out
      }
    }
    console.log(`Kubernetes update`)
    out.kubernetes = {}
    out.kubernetes.deployment = updateYaml(srv, '/kubernetes/deployment.yaml', serviceInfo.saved.image, serviceInfo.saved.version)
    out.kubernetes.statefulSet = updateYaml(srv, '/kubernetes/statefulSet.yaml', serviceInfo.saved.image, serviceInfo.saved.version)

    console.log('serviceInfo.saved', serviceInfo.saved)
    updServiceData(srv, serviceInfo.saved)
  } catch (error) {
    out.error = error.message || error
  }
  return out
}

app.get('/analizeDev', async function (req, res) {
  try {
    var response = { services: await getServicesInfo() }
    res.send(JSON.stringify(response))
  } catch (error) {
    res.send(JSON.stringify(error))
  }
})
app.get('/buildService', async function (req, res) {
  try {
    var info = await getServiceInfo(req.query.service)
    var response = {}
    if (!info.haveUpdates && !req.query.force)response = {'success': 'service not need to build'}
    else response = {'success': 'service builted', 'build': build(req.query.service)}
    res.send(JSON.stringify(response))
  } catch (error) {
    res.send(JSON.stringify(error))
  }
})
app.get('/getUpdatedKubernetesYaml', async function (req, res) {
  try {
    var response = {}
    var srv = req.query.service
    if (isFile(srvPathFile(srv, '/kubernetes/deployment.yaml'))) {
      response.deployment = fs.readFileSync(srvPathFile(srv, '/kubernetes/deployment.yaml'), 'utf8')
    }
    if (isFile(srvPathFile(srv, '/kubernetes/statefulSet.yaml'))) {
      response.statefulSet = fs.readFileSync(srvPathFile(srv, '/kubernetes/statefulSet.yaml'), 'utf8')
    }
    res.send(JSON.stringify(response))
  } catch (error) {
    res.send(JSON.stringify(error))
  }
})
app.get('/getAllKubernetesYaml', async function (req, res) {
  try {
    var srv = req.query.service
    var files = getFiles(srvPathFile(srv, '/kubernetes/'))
    console.log(files)
    var response = { }
    files.forEach(file => { response[file] = fs.readFileSync(srvPathFile(srv, '/kubernetes/' + file), 'utf8') })
    res.send(JSON.stringify(response))
  } catch (error) {
    res.send(JSON.stringify(error))
  }
})

server.connection = app.listen(CONFIG.httpPort)
module.exports = {
  CONFIG,
  app,
  server
}
