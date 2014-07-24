var HTTP = require("http")
var Replay = require("replay")
var URL = require("url")
var request = require("request")
var debug = require("debug")("proxy")
var fs = require('fs')
var pidfile = __dirname + '/form_proxy.pid'

try {
  var pid = fs.readFileSync(pidfile)
  //REPLACE with your signal or use another method to check process existence :)
  process.kill(pid, 'SIGUSR2')
  debug('Master was already running')
} catch (e) {}

// Write to pidfile...
fs.writeFileSync(pidfile, process.pid.toString(), 'ascii')

process.on("uncaughtException", function(error){
  console.log("REPLAYER Uncaught Exception")
  console.log(error.stack)
  // process.exit(0)
})

Replay.fixtures = __dirname + "/../requests"
Replay.mode = (process.env.REPLAY || "replay")

var port = process.env.PROXY_PORT || 8800
var url = 'http://example.com'

var server = HTTP.createServer(function(req, res){

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
  res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'])

  if (/options/i.test(req.method) || /favicon.ico/i.test(req.url)) {
    res.writeHead(200)
    return res.end()
  }

  req.headers.host = 'example.com'

  var opts = {
    method: req.method,
    headers: req.headers,
    url: url + req.url
  }

  debug(opts.method, opts.url)
  debug(JSON.stringify(opts.headers))

  var client = request(opts)
    .on('error', function(error){
      console.log('error in request', error.stack)
      throw error
    }).pipe(res)
  return req.pipe(client)

})

server.on('error', function(error){
  if (error.code === 'EADDRINUSE')
    debug('Proxy is either already running or the port is being used.')
})

server.listen(port, function(){
  debug("Listening on port", port)
})