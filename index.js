const express = require('express')
const unquote = require('unquote')
const path = require('path')
const app = express()
const fs = require('fs')

const initParams = fs.readFileSync(path.resolve(__dirname, 'init.sh'), { encoding: 'utf-8' }).split('\n').reduce((memo, line) => {
    if (line.indexOf('=') > 0) {
        const [key, value] = line.split('=', 2)
        memo[key] = unquote(value)
    }
    return memo
}, {})

const parseSegment = (a) => {
    let [_, timestamp, duration] = a.replace('.ts', '').split('_')
    let extinf = duration.slice(duration.slice(0, -6) + '.' + duration.slice(-6))
    timestamp = Number.parseInt(timestamp)
    duration = Number.parseInt(duration)
    return { timestamp, duration, extinf }
}

app.get('/:folder/(:shift?)', (req, res, next) => {
    let { folder, shift } = req.params
    if (!shift || !Number.parseInt(shift)) {
        shift = 20
    } else {
        shift = Number.parseInt(shift)
    }

    fs.readdir(path.join(initParams.BASE, folder), (err, files) => {
        const fromDate = Math.floor(Date.now() / 1000) - shift
        const buffer = [
            '#EXTM3U',
            '#EXT-X-VERSION:3',
            '#EXT-X-TARGETDURATION:10',
            `#EXT-X-MEDIA-SEQUENCE:${fromDate}`
        ]

        const segments = files.sort((a, b) => a.localeCompare(b))
            .filter(a => parseSegment(a).timestamp >= fromDate)
            .slice(0, 10)
            .forEach(segment => {
                buffer.push(`#EXTINF:${parseSegment(segment).extinf},`)
                buffer.push(segment)
            })

        res.send(buffer.join('\n'))
    })
})
app.get(/([a-zA-Z0-9]*)\/([a-zA-Z0-9_]*)\.ts/, (req, res) => {
    const [folder, file] = req.params
    res.sendFile(path.join(folder, file + '.ts'), { root: initParams.BASE })
})

app.listen(8080, () => console.log('Listening on port 8080'))
