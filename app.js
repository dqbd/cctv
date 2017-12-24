const express = require('express')
const path = require('path')
const fs = require('fs')

const Config = require('./server/config')
const Database = require('./server/database')
const Manifest = require('./server/manifest')

const config = new Config(path.resolve(__dirname, 'init.sh'))
const db = new Database(path.resolve(__dirname, 'app.db'))
const factory = new Manifest(config)

const maxAge = 7 * 24 * 60 * 60 /* keep records of one week */
const cleanupPolling = 60 /* every minute */

const app = express()

const loadFolder = (folder) => {
    console.log('Initializing folder', folder)
    db.insertBulk(folder, fs.readdirSync(path.resolve(config.base(), folder)))

    console.log('-- Hooking watch')
    fs.watch(path.resolve(config.base(), folder), (event, filename) => {
        if (filename.indexOf('sg_') != 0) return
        if (fs.existsSync(path.resolve(config.base(), folder, filename))) {
            db.insert(folder, filename)
        } else {
            db.remove(folder, filename)
        }
    })

    console.log('-- Hooking delete')
    setInterval(() => {
        db.tooOld(folder, maxAge).forEach(({ filename }) => {
            fs.unlink(path.resolve(config.base(), folder, filename), (error) => console.error)
        })
    }, cleanupPolling * 1000)
}

const detect = () => {
    fs.readdir(config.base(), (err, files) => {
        files
            .filter((item) => {
                const stat = fs.lstatSync(config.base(), item)
                return stat.isDirectory() && fs.existsSync(path.resolve(config.base(), item, config.name()))
            })
            .forEach(loadFolder)
    })
}

detect()

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

app.listen(8080, () => {
    console.log('Listening at 8080')
})