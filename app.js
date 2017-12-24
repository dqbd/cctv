const express = require('express')
const path = require('path')
const fs = require('fs')

const Config = require('./server/config')
const Ffmpeg = require('./server/ffmpeg')
const Database = require('./server/database')
const Manifest = require('./server/manifest')

const config = new Config(path.resolve(__dirname, 'init.sh'))
const db = new Database(path.resolve(__dirname, 'app.db'), { memory: true })
const factory = new Manifest(config)

const maxAge = 7 * 24 * 60 * 60 /* keep records of one week */
const cleanupPolling = 60 /* every minute */

const app = express()
const instances = []

const mappings = {
    "OBCHOD": "rtsp://192.168.1.164:554/user=admin&password=&channel=1&stream=0.sdp?real_stream",
    "VENKU": "rtsp://192.168.1.168:554/user=admin&password=&channel=1&stream=0.sdp?real_stream",
}

const performCleanup = (folder) => {
    console.log('CLEANUP', folder)

    const toDelete = db.tooOld(folder, maxAge)

    console.time('- delete from DB')
    db.removeBulk(folder, toDelete)
    console.timeEnd('- delete from DB')
    
    console.time('- delete from FS')
    toDelete.forEach(({ filename }) => {
        fs.unlink(path.resolve(config.base(), folder, filename), (error) => console.error)
    })
    console.timeEnd('- delete from FS')

    setTimeout(() => this.performCleanup(folder), cleanupPolling * 1000)
}

const loadFolder = (folder, address) => {
    console.log('LOADFOLDER', folder)
    console.time(`initialize ${folder}`)
    db.insertBulk(folder, fs.readdirSync(path.resolve(config.base(), folder)))
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

Object.keys(mappings).forEach(loadFolder)

app.get('/:folder/stream.m3u8', (req, res) => {
    const { folder } = req.params
    const { shift } = req.query

    if (!folder) return res.status(400).send('Invalid parameters')
    
    res.set('Content-Type', 'application/x-mpegURL')
    if(!shift){
        res.sendFile(path.join(config.base(), folder, config.name()))
    } else {
        res.send(factory.getManifest(shift, db.shift(folder, shift)))
    }
})

app.get('/:folder/slice.m3u8', (req, res) => {
    if(!req.query.from) return next()
    const { folder } = req.params
    const { from, to } = req.query

    if (!folder || !from || !to) return res.status(400).send("No query parameters set")

    res.set('Content-Type', 'application/x-mpegURL')
    res.send(factory.getManifest(`${from}${to}`, db.seek(folder, from, to), true))
})

app.get('/:folder/:file', (req, res, next) => {
    const { folder, file } = req.params
    if (file.indexOf('.ts') < 0) return next()
    res.sendFile(path.join(folder, file + '.ts'), { root: config.base() })
})

process.on("SIGTERM", () => {
    db.close()
    instances.forEach(instance => instance.stop())
})

app.listen(8080, () => {
    console.log('Listening at 8080')
})
