const express = require('express')
const path = require('path')
const fs = require('fs')

const Config = require('./server/config')
const Ffmpeg = require('./server/ffmpeg')
const Database = require('./server/database')
const Manifest = require('./server/manifest')

const config = new Config(path.resolve(__dirname, 'init.sh'))
const db = new Database(path.resolve(__dirname, 'app.db'))
const factory = new Manifest(config)

const maxAge = 7 * 24 * 60 * 60 /* keep records of one week */
const cleanupPolling = 15 /* every day */

const app = express()
const instances = []

const mappings = {
    "OBCHOD": "rtsp://192.168.1.164:554/user=admin&password=&channel=1&stream=0.sdp?real_stream",
    "VENKU": "rtsp://192.168.1.168:554/user=admin&password=&channel=1&stream=0.sdp?real_stream",
}

const performCleanup = (folder) => {
    console.log('CLEANUP', folder)
    return db.tooOld(folder, maxAge).then((rows) => {
        let promises = [db.removeBulk(folder, rows)]
        rows.forEach(({ filename }) => {
            promises.push(new Promise((resolve) => {
                fs.unlink(path.resolve(config.base(), folder, filename), resolve)
            }))
        })
    
        return Promise.all(promises).then(() => {
            setTimeout(() => performCleanup(folder), cleanupPolling * 1000)
        })
    })
}

const loadFolder = async (folder, address) => {
    await db.insertBulk(folder, fs.readdirSync(path.resolve(config.base(), folder)))
    await performCleanup(folder)
    fs.watch(path.resolve(config.base(), folder), (event, filename) => {
        if (filename.indexOf('sg_') != 0) return
        if (fs.existsSync(path.resolve(config.base(), folder, filename))) {
            db.insert(folder, filename)
        }
    })

    instances.push(new Ffmpeg(config, folder, address))
}

app.get('/:folder/stream.m3u8', async (req, res) => {
    const { folder } = req.params
    const { shift } = req.query

    if (!folder) return res.status(400).send('Invalid parameters')

    res.set('Content-Type', 'application/x-mpegURL')
    if(!shift) {
        console.log('receiving stream file')
        res.sendFile(path.join(folder, config.name()), { root: config.base() })
    } else {
        res.send(factory.getManifest(shift, await db.shift(folder, shift)))
    }
})

app.get('/:folder/slice.m3u8', async (req, res) => {
    if(!req.query.from) return next()
    const { folder } = req.params
    const { from, to } = req.query

    if (!folder || !from || !to) return res.status(400).send("No query parameters set")

    res.set('Content-Type', 'application/x-mpegURL')
    res.send(factory.getManifest(`${from}${to}`, await db.seek(folder, from, to), true))
})

app.get('/:folder/:file', (req, res, next) => {
    const { folder, file } = req.params
    if (file.indexOf('.ts') < 0) return next()
    res.sendFile(path.join(folder, file), { root: config.base() })
})

process.on("SIGTERM", () => {
    db.close()
    instances.forEach(instance => instance.stop())
})

Promise.all(Object.keys(mappings).map((folder) => loadFolder(folder, mappings[folder])))
    .then(() => {
        app.listen(8080, () => {
            console.log('Instances starting')
            // instances.forEach(instance => instance.loop())
            console.log('Listening at 8080')
        })
    })



