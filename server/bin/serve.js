const protoo = require('protoo-server')
const express = require('express')
const path = require('path')
const url = require('url')
const http = require('http')
const cors = require('cors')
const fs = require('fs')
const net = require('net')
const mediasoup = require('mediasoup')

const Database = require('../lib/database')
const Manifest = require('../lib/manifest')
const Smooth = require('../lib/smooth')
const Room = require('../lib/room')
const Preview = require('../lib/preview')

const config = require('../config.js')

const defaultRoom = Symbol('default')

const main = async () => {
  const factory = new Manifest(config)
  const db = new Database(config.auth.mysql)
  
  const worker = await mediasoup.createWorker({
    logLevel: 'debug',
    logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp'],
    rtcMinPort: 40000,
    rtcMaxPort: 49999
  })

  worker.on('died', () => {
    setTimeout(() => {
      console.log('mediasoup died, stopping process')
      process.exit(1)
    }, 2000)
  })

  const soupRooms = new Map()
  soupRooms.set(defaultRoom, await Room.create(config.mediasoup, worker))
  for (const key of Object.keys(config.targets)) {
    soupRooms.set(key, await Room.create(config.mediasoup, worker))
  }

  const valve = new Smooth(db)
  const app = express()

  try {
    fs.unlinkSync(config.ipcBase)
  } catch (err) {
    console.log(err)
  }
  const unixServer = net.createServer((client) => {
    let broadcaster = null
    
    client.on('data', async (buffer) => {
      const payload = JSON.parse(buffer.toString('utf-8'))
      if (!broadcaster && payload.id && soupRooms.has(payload.id)) {
        broadcaster = await soupRooms.get(payload.id).createBroadcaster(payload)
      }

      if (broadcaster) {
        client.write(Buffer.from(JSON.stringify({
          ip: broadcaster.ip,
          port: broadcaster.port,
        })))
      }
    })

    client.on('close', async () => {
      if (broadcaster) await soupRooms
        .get(broadcaster.id)
        .deleteBroadcaster({ id: broadcaster.id })
    })
  })

  app.use(cors())
  
  app.get('/streams', (req, res) => {
    res.set('Content-Type', 'application/json')
    res.send({
      data: Object
        .entries(config.targets)
        .map(([key, { name }]) => ({ key, name })),
    })
  })

  app.get('/data/:folder/slice.m3u8', async (req, res) => {
    if(!req.query.from) return next()
    const { folder } = req.params
    const { from, to } = req.query

    if (!folder || !from || !to) return res.status(400).send("No query parameters set")

    res.set('Content-Type', 'application/x-mpegURL')
    res.send(factory.getManifest(`${from}${to}`, await db.seek(folder, from, to), 1, true))
  })
  
  app.get('/data/:folder/stream.m3u8', async (req, res) => {
    const { folder } = req.params
    let { shift = 0 } = req.query
    if (!folder) return res.status(400).send('Invalid parameters')
    const { seq, segments } = await valve.seek(folder, shift)

    res.set('Content-Type', 'application/x-mpegURL')
    res.send(factory.getManifest(shift, segments, seq))
  })
  
  app.get('/data/:folder/:date/:file', (req, res, next) => {
    const { folder, date, file } = req.params
    if (file.indexOf('.ts') < 0) return next()
    res.sendFile(path.join(folder, date, file), { root: config.base })
  })

  app.get('/frame/:folder', async (req, res) => {
    const { folder } = req.params
    const { refresh } = req.query
    
    if (!(folder in config.targets)) {
      res.status(404)
      res.send()
      return
    }
    
    try {
      const payload = await Preview.getScreenshot(config.targets[folder].onvif, !!refresh)
      res.setHeader('Content-Type', 'image/jpeg')
      res.setHeader('Content-Transfer-Encoding', 'binary')
      res.send(payload)
    } catch (err) {
      console.log(err)
      res.status(500)
      res.send()
    }
  })
  
  app.use(express.static(path.resolve(__dirname, '../../', 'client', 'build')))
  
  app.get('*', (_, res) => res.sendFile(path.resolve(__dirname, '../../', 'client', 'build', 'index.html')))
  
  unixServer.listen(config.ipcBase)

  const httpServer = http.createServer(app)

  const protooServer = new protoo.WebSocketServer(httpServer, {
    maxReceivedFrameSize: 960000,
		maxReceivedMessageSize: 960000,
		fragmentOutgoingMessages: true,
		fragmentationThreshold: 960000
  }) 

  protooServer.on('connectionrequest', (info, accept, reject) => {
		const u = url.parse(info.request.url, true)
    const peerId = u.query['peerId']
    const roomId = u.query['roomId'] || defaultRoom

		if (!peerId) {
			reject(400, 'Connection request without peerId')
			return
    }

    if (!soupRooms.has(roomId)) {
      reject(400, 'Invalid roomId')
      return
    }
    
    try {
      const protooWebSocketTransport = accept() 
      soupRooms.get(roomId).handleProtooConnection({ peerId, protooWebSocketTransport })
    } catch (err) {
      reject(err)
    }
  })
  
  httpServer.listen(config.port, () => console.log(`Listening at ${config.port}`))
}

main()
