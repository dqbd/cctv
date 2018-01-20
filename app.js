const express = require('express')
const path = require('path')
const fs = require('fs')
const cors = require('cors')

const Config = require('./server/config')
const Ffmpeg = require('./server/ffmpeg')
const Database = require('./server/database')
const Manifest = require('./server/manifest')

const config = new Config(require('./config.js'))
const db = new Database(path.resolve(__dirname, 'app.db'), { memory: true })
const factory = new Manifest(config)

const app = express()
const instances = []

const performCleanup = (folder) => {
    console.log('CLEANUP', folder)

    const toDelete = db.tooOld(folder, config.maxAge())

    console.time('- delete from DB')
    db.removeBulk(folder, toDelete)
    console.timeEnd('- delete from DB')

    console.time('- delete from FS')
    toDelete.forEach(({ filename }) => {
        fs.unlink(path.resolve(config.base(), folder, filename), (error) => console.error)
    })
    console.timeEnd('- delete from FS')

    setTimeout(() => performCleanup(folder), config.cleanupPolling() * 1000)
}

const loadFolder = (folder, address) => {
    console.log('LOADFOLDER', folder, path.resolve(config.base(), folder))
    console.time(`initialize ${folder}`)

    console.time(`ls ${folder}`)
    const files = fs.readdirSync(path.resolve(config.base(), folder))
    console.timeEnd(`ls ${folder}`)

    db.insertBulk(folder, files)
    console.timeEnd(`initialize ${folder}`)

    console.time(`cleanup ${folder}`)
    performCleanup(folder)
    console.timeEnd(`cleanup ${folder}`)

    console.time(`watch ${folder}`)
    fs.watch(path.resolve(config.base(), folder), (event, filename) => {
        if (filename.indexOf('sg_') != 0) return
        if (fs.existsSync(path.resolve(config.base(), folder, filename))) {
            db.insert(folder, filename)
        }
    })
    console.timeEnd(`watch ${folder}`)

    instances.push(new Ffmpeg(config, folder, address))
}

app.use(cors())

app.get('/streams', (req, res) => {
    res.set('Content-Type', 'application/json')
    console.log(config.targets())
    res.send({
        data: Object.keys(config.targets()).map((key) => (
            { key, name: config.targets()[key].name }
        )),
    })
})

app.get('/data/:folder/stream.m3u8', (req, res) => {
    const { folder } = req.params
    const { shift } = req.query

    if (!folder) return res.status(400).send('Invalid parameters')

    res.set('Content-Type', 'application/x-mpegURL')
    if(!shift) {
        console.log('receiving stream file')
        res.sendFile(path.join(folder, config.name()), { root: config.base() })
    } else {
        res.send(factory.getManifest(shift, db.shift(folder, shift)))
    }
})

app.get('/data/:folder/slice.m3u8', (req, res) => {
    if(!req.query.from) return next()
    const { folder } = req.params
    const { from, to } = req.query

    if (!folder || !from) return res.status(400).send("No query parameters set")

    res.set('Content-Type', 'application/x-mpegURL')
    res.send(factory.getManifest(`${from}${to}`, db.seek(folder, from, to), !!to))
})

app.get('/data/:folder/:file', (req, res, next) => {
    const { folder, file } = req.params
    if (file.indexOf('.ts') < 0) return next()
    res.sendFile(path.join(folder, file), { root: config.base() })
})

app.use(express.static(path.resolve(__dirname, 'client', 'build')))

// Object.keys(config.targets()).forEach((folder) => loadFolder(folder, config.source(folder)))

process.on("SIGTERM", () => {
    db.close()
    instances.forEach(instance => instance.stop())
})

app.listen(config.port(), () => {
    instances.forEach(instance => instance.loop())
    console.log(`Listening at ${config.port()}`)
})
