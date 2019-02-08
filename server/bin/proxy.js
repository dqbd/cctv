const auth = require('basic-auth')
const httpProxy = require('http-proxy')
const http = require('http')
const config = require('../config.js')
const compare = require('tsscmp')

const { username, password } = require('./auth.json')
const targetUrl = `http://localhost:${config.port}`

const check = (name, pass) => {
  var valid = true
 
  // Simple method to prevent short-circut and use timing-safe compare
  valid = compare(name, username) && valid
  valid = compare(pass, password) && valid
 
  return valid
}

const proxy = httpProxy.createProxyServer()
const server = http.createServer((req, res) => {
  const credentials = auth(req)

  if (!credentials || !check(credentials.name, credentials.pass)) {
    res.statusCode = 401
    res.setHeader('WWW-Authenticate', 'Basic realm="example"')
    res.end('Invalid auth')
  } else {
    proxy.web(req, res, {
      target: targetUrl,
    })
  }
})

server.listen(config.wanPort, () => {
  console.log('Listening WAN from', config.wanPort)
})