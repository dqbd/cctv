const express = require('express')
const unquote = require('unquote')
const path = require('path')
const app = express()
const fs = require('fs')

const showSegments = 5
const initParams = fs.readFileSync(path.resolve(__dirname, 'init.sh'), { encoding: 'utf-8' }).split('\n').reduce((memo, line) => {
    if (line.indexOf('=') > 0) {
        const [key, value] = line.split('=', 2)
        memo[key] = unquote(value)
    }
    return memo
}, {})

const sequenceCache = {}
const parseSegment = (a) => {
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
    const shift = (req.query.shift && Number.parseInt(req.query.shift)) || 100

    if (!sequenceCache[shift]) {
        sequenceCache[shift] = {
            sequence: 0,
            data: undefined,
        }
    }

    fs.readdir(path.join(initParams.BASE, folder), (err, files) => {
        if (err) return next(err)
 
        const fromDate = Math.floor(Date.now() / 1000) - shift
        const buffer = [
            '#EXTM3U',
            '#EXT-X-VERSION:3',
            '#EXT-X-TARGETDURATION:12',
        ]

        if (files) {
            const segments = files.sort((a, b) => a.localeCompare(b))
                .filter((a, index) => {
                    const segment = parseSegment(a)
                    return segment && (segment.timestamp >= fromDate || index >= files.length - showSegments)
                })
                .slice(0, showSegments)

            const serialized = segments.join()
            if (sequenceCache[shift].data !== serialized) {
                sequenceCache[shift].sequence += 1
                sequenceCache[shift].data = serialized
            }

            buffer.push(`#EXT-X-MEDIA-SEQUENCE:${sequenceCache[shift].sequence}`)

            segments
                .forEach(segment => {
                    buffer.push(`#EXTINF:${parseSegment(segment).extinf},`)
                    buffer.push(segment)
                })
        } else {
            buffer.push(`#EXT-X-MEDIA-SEQUENCE:${sequenceCache[shift].sequence}`)
        }

        res.set('Content-Type', 'application/x-mpegURL')
        res.send(buffer.join('\n') + '\n')
    })
})
app.get(/([a-zA-Z0-9]*)\/([a-zA-Z0-9_]*)\.ts/, (req, res) => {
    const [folder, file] = Object.values(req.params)
    res.sendFile(path.join(folder, file + '.ts'), { root: initParams.BASE })
})

app.listen(8080, () => console.log('Listening on port 8080'))

// http://localhost:8080/VENKU/stream.m3u8?shift=2800