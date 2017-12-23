const express = require('express')
const unquote = require('unquote')
const path = require('path')
const app = express()
const fs = require('fs')

const showSegments = 5
const sliceDefaultLength = 300
const initParams = fs.readFileSync(path.resolve(__dirname, 'init.sh'), { encoding: 'utf-8' }).split('\n').reduce((memo, line) => {
    if (line.indexOf('=') > 0) {
        const [key, value] = line.split('=', 2)
        memo[key] = unquote(value)
    }
    return memo
}, {})

const tsCache = {}
loadIntoCache('VENKU')
loadIntoCache('OBCHOD')

const sequenceCache = {}
function parseSegment(a) {
    if (!a) return null
    let [_, timestamp, duration] = a.replace('.ts', '').split('_')
    if (!duration || !timestamp) return null

    let extinf = duration.slice(0, -6) + '.' + duration.slice(-6)
    timestamp = Number.parseInt(timestamp)
    duration = Number.parseInt(duration)
    return { filename: a, timestamp, duration, extinf }
}

initParams.BASE = initParams.BASE || __dirname

app.get('/:folder/stream.m3u8', (req, res, next) => {	
    const { folder } = req.params
    if(!req.query.shift){
        res.set('Content-Type', 'application/x-mpegURL')
        res.sendFile(path.join(initParams.BASE, folder, initParams.MANIFEST_NAME))
        return
    }
    console.time(`stream.m3u8(${folder})`)

    const shift = (req.query.shift && Number.parseInt(req.query.shift)) || 100

    if (!sequenceCache[shift]) {
        sequenceCache[shift] = {
            sequence: 0,
            data: undefined,
        }
    }

    if(!tsCache[folder]) return next()
    const files = tsCache[folder]
    const fromDate = Math.floor(Date.now() / 1000) - shift
    const buffer = [
        '#EXTM3U',
        '#EXT-X-VERSION:3',
        `#EXT-X-TARGETDURATION:${initParams.SEGMENT_SIZE}`,
    ]

    if (files) {
        const index = indexDatabase(files, fromDate)
        const segments = files.slice(index, index + showSegments)

        const serialized = JSON.stringify(segments)
        if (sequenceCache[shift].data !== serialized) {
            sequenceCache[shift].sequence += 1
            sequenceCache[shift].data = serialized
        }

        buffer.push(`#EXT-X-MEDIA-SEQUENCE:${sequenceCache[shift].sequence}`)

        for(var i = 0; i < segments.length; i++){
            const segment = segments[i]
            buffer.push(`#EXTINF:${segment.extinf},`)
            buffer.push(segment.filename)
        }
    } else {
        buffer.push(`#EXT-X-MEDIA-SEQUENCE:${sequenceCache[shift].sequence}`)
    }

    res.set('Content-Type', 'application/x-mpegURL')
    res.send(buffer.join('\n') + '\n')
    console.timeEnd(`stream.m3u8(${folder})`)
    
})
app.get(/([a-zA-Z0-9]*)\/([a-zA-Z0-9_]*)\.ts/, (req, res) => {
    const [folder, file] = Object.values(req.params)
    res.sendFile(path.join(folder, file + '.ts'), { root: initParams.BASE })
})

app.get('/:folder/slice.m3u8', (req, res, next) => {
    if(!req.query.from) return next()
    const { folder } = req.params, timeslice = {from: req.query.from, length: req.query.length || sliceDefaultLength}

    const files = tsCache[folder]
    if(!files) return next()
    const buffer = [
        '#EXTM3U',
        '#EXT-X-VERSION:3',
        `#EXT-X-TARGETDURATION:${initParams.SEGMENT_SIZE}`,
    ]
    const index = indexDatabase(files, timeslice.from)
    const segments = files.slice(index, index + timeslice.length / initParams.SEGMENT_SIZE)
    buffer.push('#EXT-X-MEDIA-SEQUENCE:0')
    for(var i = 0; i < segments.length; i++){
        const segment = segments[i]
        buffer.push(`#EXTINF:${segment.extinf},`)
        buffer.push(segment.filename)
    }
    buffer.push('#EXT-X-ENDLIST')

    res.set('Content-Type', 'application/x-mpegURL')
    res.send(buffer.join('\n') + '\n')
})


// http://localhost:8080/VENKU/stream.m3u8?shift=2800

function loadIntoCache(folder){
    console.time(`loadIntoCache(${folder})`)
    const absPath = path.join(initParams.BASE, folder)
    var lastFilename = ''

    tsCache[folder] = fs
        .readdirSync(absPath)
        .sort((a, b) => (a > b ? 1 : a < b ? -1 : 0))
        .reduce((memo, item) => {
            const segment = parseSegment(item)
            if (segment && segment.timestamp) {
                memo.push(segment)
            }
            return memo
        }, [])
    console.timeEnd(`loadIntoCache(${folder})`)
    fs.watch(absPath, (event, filename) => {
        if(event != 'change' || lastFilename == filename || !filename.startsWith('sg_')) return
        tsCache[folder].push(filename)
        lastFilename = filename
    })
}

function indexDatabase(database, date){
    function sliceAndFind (min, max) {
        let check = Math.floor((max + min) / 2)
        if (min === max) return check
        if (date > database[check].timestamp) {
            return sliceAndFind(check + 1, max)
        } else {
            return sliceAndFind(min, check - 1)
        }
    }
    return sliceAndFind(0, database.length - 1)
}

app.listen(8080, () => console.log('Listening on port 8080'))