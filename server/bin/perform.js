const ipc = require('node-ipc')
const url = require('url')
const path = require('path')
const mkdirp = require('mkdirp')
const ffmpeg = require('fluent-ffmpeg')
const Split = require('stream-split')
const WebSocket = require('ws')
const ClockSync = require('../lib/clocksync')

const config = require('../config.js')

const cameraKey = process.argv.slice().pop()
const target = config.targets[cameraKey]

if (!target) throw Error('Invalid argument')

const credential = config.credential
const address = target.source(cameraKey)
const previewAddress = target.preview(cameraKey)

const baseFolder = path.resolve(config.base, cameraKey)

mkdirp.sync(baseFolder)

ipc.config.id = `perform:${cameraKey}`
ipc.config.retry = 10 * 1000
ipc.config.silent = true

ipc.connectTo('serve', `${config.ipcBase}/serve`)

const start = async () => {
  const NALseparator = Buffer.from([0,0,0,1])
  const splitter = new Split(NALseparator)

  const wss = new WebSocket.Server({
    port: target.livePort
  })

  splitter.on('data', (data) => {
    wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(Buffer.concat([NALseparator, data]), { binary: true })
      }
    })
  })

  let encoders = {
    main: null,
    preview: null,
  }
  
  encoders.main = ffmpeg(address)
    .inputOptions([
      '-rtsp_transport tcp',
      '-rtsp_flags prefer_tcp',
    ])
    .addOutput(path.resolve(baseFolder, config.manifest))
    .audioCodec('copy')
    .videoCodec('copy')
    .outputOptions([
      `-hls_time ${config.segmentSize}`,
      `-use_localtime_mkdir 1`,
      `-hls_start_number_source epoch`,
      `-use_localtime 1`,
      `-hls_flags second_level_segment_duration`,
      `-hls_segment_filename ${path.resolve(baseFolder, config.segmentName)}`,
    ])
    .addOutput(splitter)
    .format('rawvideo')
    .outputOptions([
      '-bsf:v h264_mp4toannexb',
    ])
    .videoCodec('copy')
    .audioCodec('copy')
    .on('start', (cmd) => console.log('Command', cmd))
    .on('codecData', (data) => console.log('Codec data', data))
    .on('progress', (progress) => console.log('Processing', progress.frames, progress.timemark))
    .on('end', () => process.exit())
    .on('error', (err, stdout, stderr) => {
      console.log('An error occurred', err.message, stdout, stderr)
      process.exit()
    })

  encoders.preview = ffmpeg(previewAddress)
    .inputOptions([
      '-rtsp_transport tcp',
      '-rtsp_flags prefer_tcp',
    ])
    .videoFilters([
      `crop=iw:ih-30:0:30`,
      `select='gte(scene\\,0)'`,
      `metadata=print`
    ])
    .noAudio()
    .on('stderr', (stderrLine) => {
      if (stderrLine.indexOf('lavfi.scene_score') >= 0) {
        let [key, value] = stderrLine.split(" ").pop().split("=")
        value = Number.parseFloat(value, 10)
        
        console.log('Sending value', value)
        wss.clients.forEach((ws) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ value }))
          }
        })

        ipc.of.serve.emit('perform.scene', { id: cameraKey, value })
      }
    })
    .on('codecData', (data) => console.log('Codec data preview', data))
    .on('end', () => process.exit())
    .on('error', (err) => {
      console.log('An error occurred in preview', err.message)
      process.exit()
    })
    .addOutput('/dev/null')
    .outputOptions(['-f null'])


  encoders.main.run()
  encoders.preview.run()

  const hostname = url.parse(address).hostname
  
  let timeSyncTimer = null
  const timeSync = async () => {
    clearTimeout(timeSyncTimer)
  
    console.time(`timeSync ${cameraKey}`)
    try {
      await ClockSync.setSystemTime(credential, hostname)
    } catch(err) {
      console.error(`failed to set ${cameraKey} time:`, err)
    }
    console.timeEnd(`timeSync ${cameraKey}`)
    timeSyncTimer = setTimeout(timeSync, 60 * 1000)
  }
  timeSync()
  
  process.on('exit', () => {
    console.log('Closing', cameraKey)
    clearTimeout(timeSyncTimer)

    try {
      if (encoders.main) encoders.main.kill()
    } catch (err) {
      console.log(err)
    }

    try {
      if (encoders.preview) encoders.preview.kill()
    } catch (err) {
      console.log(err)
    }

    try {
      if (wss) wss.close()
    } catch (err) {
      console.log(err)
    }

    try {
      ipc.disconnect('serve')
    } catch(err) {
      console.log(err)
    }
  })
}

try {
  start()
} catch (err) {
  console.log(err)
}