const protoo = require('protoo-server')
const express = require('express')
const path = require('path')
const url = require('url')
const http = require('http')
const cors = require('cors')

const Database = require('../lib/database')
const Manifest = require('../lib/manifest')
const Smooth = require('../lib/smooth')
const Router = require('../lib/router')
const Room = require('../lib/room')

const config = require('../config.js')

const main = async () => {
  const factory = new Manifest(config)
  const db = new Database(config.auth.mysql)
  const soup = await Room.create(config.mediasoup)
  
  const valve = new Smooth(db)
  const app = express()
  
  app.use(cors())
  app.post('/room/broadcasters', async (req, res, next) => {
    const { id, displayName, device, rtpCapabilities } = req.body
    try {
      const data = await soup.createBroadcaster({ id, displayName, device, rtpCapabilities })
      res.status(200).json(data);
    } catch (error) {
      next(error)
    }
  })

	app.delete('/room/broadcasters/:broadcasterId', (req, res) => {
    const { broadcasterId } = req.params
    soup.deleteBroadcaster({ broadcasterId })
    res.status(200).send('broadcaster deleted')
  })

	app.post('/room/broadcasters/:broadcasterId/transports', async (req, res, next) => {
    const { broadcasterId } = req.params
    const { type, rtcpMux, comedia, multiSource } = req.body

    try {
      const data = await soup.createBroadcasterTransport({ broadcasterId, type, rtcpMux, comedia, multiSource })
      res.status(200).json(data)
    } catch (error) {
      next(error)
    }
  })

	app.post('/room/broadcasters/:broadcasterId/transports/:transportId/producers', async (req, res, next) => {
    const { broadcasterId, transportId } = req.params;
    const { kind, rtpParameters } = req.body;

    try {
      const data = await globalRoom.createBroadcasterProducer({ broadcasterId, transportId, kind, rtpParameters })
      res.status(200).json(data)
    } catch (error) {
      next(error)
    }
  })

  app.get('/streams/rtsp', async (req, res) => {
    const mappings = await Router.getForwards(config.auth.router)

    const data = Object.entries(config.targets).reduce((memo, [key, item]) => {
      const found = mappings.find(({ addr }) => item.source.indexOf(addr) >= 0)
      if (found && found.ext) {
        const [source, preview] = [item.source, item.preview].map(link => url.format({
          ...url.parse(link),
          host: `[HOST]:${found.ext}`,
        }))
        
        memo.push({
          key,
          name: item.name,
          source,
          preview,
        })
      }
      return memo
    }, [])

    res.send({ data })
  })
  
  app.get('/streams', (req, res) => {
    res.set('Content-Type', 'application/json')
    res.send({
      data: Object
        .entries(config.targets)
        .map(([key, { name, port }]) => ({ key, name, port })),
    })
  })

  app.get('/scene/:folder', async (req, res) => {
    const { folder } = req.params
    res.set('Content-Type', 'application/json')
    res.send({
      data: await db.getScenes(folder),
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
  
  app.use(express.static(path.resolve(__dirname, '../../', 'client', 'build')))
  
  app.get('*', (_, res) => res.sendFile(path.resolve(__dirname, '../../', 'client', 'build', 'index.html')))
  
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

		if (!peerId) {
			reject(400, 'Connection request without peerId')
			return
    }
    
    try {
      const protooWebSocketTransport = accept() 
      soup.handleProtooConnection({ peerId, protooWebSocketTransport })
    } catch (err) {
      reject(err)
    }
  })
  
  httpServer.listen(config.port, () => console.log(`Listening at ${config.port}`))
}

main()