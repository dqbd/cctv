const path = require('path')
const chokidar = require('chokidar')
const express = require('express')

const Config = require('./server/config')
const Database = require('./server/database')
const Manifest = require('./server/manifest')

const config = new Config(path.resolve(__dirname, 'init.sh'))
const db = new Database(path.resolve(__dirname, 'app.db'))
const factory = new Manifest(config)

const maxAge = 7 * 24 * 60 * 60 /* keep records of one week */
const cleanupPolling = 60 /* every minute */

const app = express()

const init = (folder) => {
    chokidar.watch(path.resolve(config.base(), folder))
        .on('add', (loc) => {
            if (path.extname(loc) != '.ts') return
            db.insert(folder, path.basename(loc))
        })
        .on('unlink', (loc) => {
            if (path.extname(loc) != '.ts') return
            db.remove(folder, path.basename(loc))
        })

    setInterval(() => {
        db.tooOld(folder, maxAge).forEach(({ filename }) => {
            fs.unlink(path.resolve(config.base(), folder, filename), (error) => console.error)
        })
    }, cleanupPolling * 1000)
}

init('VENKU')
init('OBCHOD')

app.get(/([a-zA-Z0-9]*)\/([a-zA-Z0-9_]*)\.ts/, (req, res) => {
    const [folder, file] = Object.values(req.params)
    res.sendFile(path.join(folder, file + '.ts'), { root: config.base() })
})

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
    res.send(factory.getManifest(`${from}${to}`, db.seek(folder, from, to)))
})