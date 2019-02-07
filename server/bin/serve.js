const express = require('express')
const path = require('path')
const http = require('http')
const fs = require('fs')
const cors = require('cors')
const util = require('util')
const ipc = require('node-ipc')
const mkdirp = require('mkdirp')
const chokidar = require('chokidar')

const readdir = util.promisify(fs.readdir)

const Config = require('./server/config')
const Database = require('./server/database')
const Manifest = require('./server/manifest')
const Smooth = require('./server/smooth')

const config = new Config(require('./config.js'))
const db = new Database(path.resolve(__dirname, 'app.db'), { memory: true })
const factory = new Manifest(config)
const valve = new Smooth(db)

const app = express()

Promise.all(Object.keys(config.targets()).map(async (cameraKey) => {
    const folderTarget = path.resolve(config.base(), cameraKey)
    mkdirp.sync(folderTarget)

    const listed = await readdir(folderTarget).then(
        folders => Promise.all(
            folders
                .filter(folder => folder.indexOf('_') >= 0)
                .map(async target => {
                    console.log('Loading into database', cameraKey, target)
                    return [target, await readdir(path.resolve(folderTarget, target))]
                })
        )
    )
    
    listed.forEach(subfolder => db.insertFolder(cameraKey, subfolder))
}))

const parseTargetEvent = (target) => {
    const relative = path.relative(config.base(), target)
    const cameraKey = relative.split(path.sep).shift()
    const finalPath = path.relative(path.resolve(config.base(), cameraKey), target)
    return { cameraKey, finalPath }
}

chokidar.watch(config.base(), {
    ignoreInitial: true,
})
    .on('add', target => {
        if (target.indexOf('_0.ts') >= 0) return
        
        const { cameraKey, finalPath } = parseTargetEvent(target)
        console.log(`File ${cameraKey} ${finalPath} has been added`)
        db.insert(cameraKey, finalPath)
    })
    .on('unlink', target => {
        if (target.indexOf('_0.ts') >= 0) return
        
        const { cameraKey, finalPath } = parseTargetEvent(target)
        console.log(`File ${cameraKey} ${finalPath} has been removed`)
        db.remove(cameraKey, finalPath)
    })


ipc.config.id = 'serve'
ipc.config.retry = 10 * 1000
ipc.config.silent = true

ipc.serve(
    `${config.ipcBase()}/serve`,
    () => {
        ipc.server.on('perform.scene', ({ id, value }) => {
            db.addScene(id, value)
        })
    }
)

const cleanupInterval = setInterval(() => {
    Object.keys(config.targets()).forEach(cameraKey => {
        db.removeOldScenes(cameraKey, config.maxAge())
    })
}, config.cleanupPolling() * 1000)

ipc.server.start()

app.use(cors())

app.get('/streams', (req, res) => {
    res.set('Content-Type', 'application/json')
    res.send({
        data: Object.keys(config.targets()).map((key) => (
            { key, name: config.targets()[key].name, port: config.targets()[key].port }
            )),
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
    console.log(folder, date, file)
    if (file.indexOf('.ts') < 0 && file.indexOf('.bmp') < 0) return next()
    res.sendFile(path.join(folder, date, file), { root: config.base() })
})

app.use(express.static(path.resolve(__dirname, 'client', 'build')))

app.get('*', (req, res) => res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html')))

process.on("SIGTERM", () => db.close())


http.createServer(app).listen(config.port(), () => {
    console.log(`Listening at ${config.port()}`)
})

process.on('exit', () => {
    clearInterval(cleanupInterval)
})
