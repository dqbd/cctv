const path = require('path')
const url = require('url')
const fs = require('fs')
const mkdirp = require('mkdirp')
const ffmpeg = require('fluent-ffmpeg')
const Split = require('stream-split')
const WebSocket = require('ws')

const Config = require('./server/config')
const ClockSync = require('./server/clocksync')
const config = new Config(require('./config.js'))

const cameraKey = process.argv.slice().pop()
const address = config.source(cameraKey)
const baseFolder = path.resolve(config.base(), cameraKey)
const socketPort = `ws://127.0.0.1:${config.livePort(cameraKey)}/`


if (!config.targets()[cameraKey]) throw Error('Invalid argument')
mkdirp.sync(baseFolder)

// class Bridge {
//   constructor() {
//     this.socket = null
//     this.socketTimer = null
    
//     this.sending = false
//   }

//   connect() {
//     this.sending = false
//     console.log('Connecting to bridge')

//     this.socket = new WebSocket(socketUrl)
//     this.socket.on('open', () => {
//       console.log('Bridge connected')
//       this.socket.send(JSON.stringify({
//         type: 'source',
//         payload: cameraKey,
//       }))
  
//       this.sending = true
//     })
  
//     this.socket.on('close', () => {
//       console.log('Bridge closed, reconnecting')
//       clearTimeout(this.socketTimer)
//       this.socketTimer = setTimeout(this.connect.bind(this), 3 * 1000)
//     })
  
//     this.socket.on('error', (err) => {
//       console.log('Bridge error', err.message)
//       this.socket.close()
//     })
//   }

//   send(data, args) {
//     if (this.socket && this.sending && this.socket.readyState === WebSocket.OPEN) {
//       this.socket.send(data, args)
//     }
//   }
// }

const start = async () => {
  const NALseparator = new Buffer([0,0,0,1])
  const splitter = new Split(NALseparator)

  const wss = new WebSocket.Server({
    port: config.livePort(cameraKey)
  })

  splitter.on('data', (data) => {
    wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(Buffer.concat([NALseparator, data]), { binary: true })
      }
    })
  })
  
  const instance = ffmpeg(address)
    .inputOptions([
      '-rtsp_transport tcp',
      '-rtsp_flags prefer_tcp',
    ])
    .addOutput(path.resolve(baseFolder, config.name()))
    .audioCodec('copy')
    .videoCodec('copy')
    .outputOptions([
      `-hls_time ${config.segmentSize()}`,
      `-use_localtime_mkdir 1`,
      `-hls_start_number_source epoch`,
      `-use_localtime 1`,
      `-timeout -1`,
      `-hls_flags second_level_segment_duration`,
      `-hls_segment_filename ${path.resolve(baseFolder, config.segmentName())}`,
    ])
    .addOutput(splitter)
    .format('rawvideo')
    .outputOptions([
      '-bsf:v h264_mp4toannexb',
    ])
    .videoCodec('copy')
    .audioCodec('copy')
    .on('start', (cmd) => console.log('Command', cmd))
    .on('codecData', (data, stdout, stderr) => console.log('Codec data', data))
    .on('progress', (progress) => console.log('Processing', progress.frames, progress.timemark))
    .on('error', (err, stdout, stderr) => {
      console.log('An error occurred', err.message, stdout, stderr)
      wss.close()
    })
    .on('end', () => wss.close())
    .run()
  
  const credential = config.credential()
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
  })
}

try {
  start()
} catch (err) {
  console.log(err)
}