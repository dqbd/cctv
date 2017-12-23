const express = require('express')
const unquote = require('unquote')
const path = require('path')
const chokidar = require('chokidar')
const fs = require('fs')
const app = express()

const showSegments = 5
const sliceDefaultLength = 300
const offset = 60 * 60 * 24 * 1 * 1000

const initParams = fs.readFileSync(path.resolve(__dirname, 'init.sh'), { encoding: 'utf-8' }).split('\n').reduce((memo, line) => {
  if (line.indexOf('=') > 0) {
    const [key, value] = line.split('=', 2)
    memo[key] = unquote(value)
  }
  return memo
}, {})

const sequenceCache = {}

initParams.BASE = initParams.BASE || __dirname

const parseSegment = (a) => {
  if (!a) return null
  let [_, timestamp, duration] = a.replace('.ts', '').split('_')
  if (!duration || !timestamp) return null

  let extinf = duration.slice(0, -6) + '.' + duration.slice(-6)
  timestamp = Number.parseInt(timestamp)
  duration = Number.parseInt(duration)
  return { filename: a, timestamp, duration, extinf }
}

class Cache {
  constructor() {
    this.storage = new Map()
  }

  _list(folder) {
    return this.storage.get(folder) || []
  }

  _set(folder, list) {
    return this.storage.set(folder, list)
  }

  build(folder) {
    fs.readdir(path.join(initParams.BASE, folder), (err, files) => {
      if (!err && files && files.length > 0) {
        this._set(
          files.reduce((memo, file) => {
            if (file.indexOf('.ts') < 0) return memo
            const segment = parseSegment(file)
            if (segment.timestamp * 1000 <= range) {
              fs.unlink(path.join(initParams.BASE, folder, file), (err) => console.error)
            } else {
              memo.push(segment)
            }
            return memo
          }, [])
          .sort((a, b) => a.timestamp - b.timestamp)
        )
      }
    })
  }

  truncate(folder) {
    let last = segments[0].timestamp
    let toDelete = 0
    let d = Date.now() - offset
    while(last * 1000 <= d) {
      toDelete++
      if (!segments[toDelete]) break
      last = segments[toDelete].timestamp
      fs.unlink(path.join(initParams.BASE, folder, segments[toDelete].filename), (err) => console.error)
    }
  
    segments.splice(0, toDelete)
  }

  push(folder, item) {

    const segment = parseSegment(path)
    let i = segments.length - 1;
    while (i >= segment.length - showSegments && segment[i].timestamp > segment.timestamp) {
      i--;
    }
    segments.splice(i, 0, segment)
    
  }
}

app.get('/:folder/stream.m3u8', (req, res, next) => {
  const { folder } = req.params
  if(!req.query.shift){
    res.set('Content-Type', 'application/x-mpegURL')
    res.sendFile(path.join(initParams.BASE, folder, initParams.MANIFEST_NAME))
    return
  }
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
      `#EXT-X-TARGETDURATION:${initParams.SEGMENT_SIZE}`,
    ]

    if (files) {
      const segments = files.sort((a, b) => (a > b ? 1 : a < b ? -1 : 0))
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

      for(var i = 0; i < segments.length; i++){
        const segment = segments[i]
          buffer.push(`#EXTINF:${parseSegment(segment).extinf},`)
          buffer.push(segment)
      }
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
app.get('/:folder/slice.m3u8', (req, res, next) => {
  if(!req.query.from) return next()
  const { folder } = req.params, timeslice = {from: req.query.from, length: req.query.length || sliceDefaultLength}
  fs.readdir(path.join(initParams.BASE, folder), (err, files) => {
    if(err) return next(err)
    const buffer = [
      '#EXTM3U',
      '#EXT-X-VERSION:3',
      `#EXT-X-TARGETDURATION:${initParams.SEGMENT_SIZE}`,
    ]

    const segments = files.sort((a, b) => (a > b ? 1 : a < b ? -1 : 0))
      .filter((a, index) => {
        const segment = parseSegment(a)
        return segment && (segment.timestamp >= timeslice.from || index >= files.length - showSegments)
      })
      .slice(0, timeslice.length / initParams.SEGMENT_SIZE)
    buffer.push('#EXT-X-MEDIA-SEQUENCE:0')
    for(var i = 0; i < segments.length; i++){
      const segment = segments[i]
      buffer.push(`#EXTINF:${parseSegment(segment).extinf},`)
      buffer.push(segment)
    }
    buffer.push('#EXT-X-ENDLIST')

    res.set('Content-Type', 'application/x-mpegURL')
    res.send(buffer.join('\n') + '\n')
  })
})
app.listen(8080, () => console.log('Listening on port 8080'))

// http://localhost:8080/VENKU/stream.m3u8?shift=2800