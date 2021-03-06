var stdin = process.stdin
if(stdin.setRawMode)stdin.setRawMode(true)
stdin.resume()
stdin.setEncoding('utf8')

stdin.on('data', function (key) {
  if (key == '\u0012' || key == 'r') { execCommandFunc() }
  if (key == '\u0003') { process.exit() }
})

var fs = require('fs')
var path = require('path')

var filesWatch = process.argv[2].split(',')
var nodeScript = process.argv[3]
var spawn = require('child_process').spawn
var basePath = process.cwd()
var execCommand
var execCommandFunc = function () {
  if (execCommand)execCommand.kill()
  console.log('\x1Bc')
  console.log('--------------------------------------------')
  console.log('--------------WATCH RESTART-----------------')
  console.log('--------------------------------------------')
  console.log('WATCH: ', process.argv)
  execCommand = spawn('node', [ path.join(basePath, nodeScript) ], { stdio: 'inherit' })
  // execCommand.stdout.on('data', data => console.log(data.toString()))
  // execCommand.stderr.on('data', data => console.log(data.toString()))
  execCommand.on('close', code => { console.log(`child process exited with code ${code}`) })
}
// fs.watchFile(, execCommandFunc)
filesWatch.forEach((fileWatch) => {
  console.log(fileWatch)
  fs.watch(path.join(basePath, fileWatch), {recursive: true}, (eventType, filename) => {
    execCommandFunc()
  })
})

execCommandFunc()
