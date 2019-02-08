const express = require('express')
const path = require('path')
const http = require('http')
const cors = require('cors')
const ipc = require('node-ipc')

const Database = require('./server/database')
const Manifest = require('./server/manifest')
const Smooth = require('./server/smooth')

const config = require('../config.js')

const db = new Database(path.resolve(__dirname, 'app.db'), { memory: true })
const factory = new Manifest(config)
const valve = new Smooth(db)

const app = express()

ipc.config.id = 'serve'
ipc.config.retry = 10 * 1000
ipc.config.silent = true

ipc.serve(
    `${config.ipcBase}/serve`,
    () => {
        ipc.server.on('perform.scene', ({ id, value }) => {
            db.addScene(id, value)
        })
    }
)

app.use(cors())

app.get('/streams', (req, res) => {
    res.set('Content-Type', 'application/json')
    res.send({
        data: Object
            .entries(config.targets)
            .map(([key, { name, port }]) => ({ key, name, port })),
    })
})

app.get('/scene/:folder', (req, res) => {
    const { folder } = req.params
    res.set('Content-Type', 'application/json')
    res.send({
        data: db.getScenes(folder),
    })
})

app.get('/data/:folder/stream.m3u8', (req, res) => {
    const { folder } = req.params
    let { shift = 0 } = req.query
    if (!folder) return res.status(400).send('Invalid parameters')
    const { seq, segments } = valve.seek(folder, shift)

    res.set('Content-Type', 'application/x-mpegURL')
    res.send(factory.getManifest(shift, segments, seq))
})

app.get('/data/:folder/slice.m3u8', (req, res) => {
    if(!req.query.from) return next()
    const { folder } = req.params
    const { from, to } = req.query

    if (!folder || !from || !to) return res.status(400).send("No query parameters set")

    res.set('Content-Type', 'application/x-mpegURL')
    res.send(factory.getManifest(`${from}${to}`, db.seek(folder, from, to), 1, true))
})

app.get('/data/:folder/:date/:file', (req, res, next) => {
    const { folder, date, file } = req.params
    if (file.indexOf('.ts') < 0 && file.indexOf('.bmp') < 0) return next()
    res.sendFile(path.join(folder, date, file), { root: config.base })
})

app.use(express.static(path.resolve(__dirname, 'client', 'build')))

app.get('*', (_, res) => res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html')))

ipc.server.start()
app.createServer(app).listen(config.port, () => {
    console.log(`Listening at ${config.port}`)
})

process.on("SIGTERM", () => db.close())