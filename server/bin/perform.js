const url = require('url')
const path = require('path')
const mkdirp = require('mkdirp')
const ffmpeg = require('fluent-ffmpeg')
const Mp4frag = require('mp4frag')
const WebSocket = require('ws')
const ClockSync = require('../lib/clocksync')

const config = require('../config.js')

const cameraKey = process.argv.slice().pop()
const target = config.targets[cameraKey]

if (!target) throw Error('Invalid argument')

const credential = config.credential
const address = target.source
const hostname = url.parse(address).hostname

const baseFolder = path.resolve(config.base, cameraKey)
mkdirp.sync(baseFolder)

const MFHD = Buffer.from([0x6d, 0x66, 0x68, 0x64])
const TFDT = Buffer.from([0x74, 0x66, 0x64, 0x74])

const start = async () => {
  const wss = new WebSocket.Server({ port: target.port })
  const fragger = new Mp4frag()

  fragger.on('segment', (data) => {
    const seqIndex = data.indexOf(MFHD) + 8
    const tfhdIndex = data.indexOf(TFDT) + 4
    const timeVersion = data[tfhdIndex]
    const timeIndex = tfhdIndex + 4

    const seq = data.slice(seqIndex, seqIndex + 4).readUInt32BE(0)
    const time = data.slice(timeIndex, timeIndex + (timeVersion === 0 ? 4 : 8))

    wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN && ws._init) {
        if (ws._initSeq === null || ws._initTime === null) {
          ws._initSeq = seq
          ws._initTime = time
        }

        const cloned = Buffer.from(data)
        cloned.writeUInt32BE(seq - ws._initSeq + 1, seqIndex)

        let carry = 0
        for (let i = timeVersion === 0 ? 3 : 7; i >= 0; i -= 1) {
          const a = time[i]
          const b = ws._initTime[i] + carry

          carry = (b > a) ? 1 : 0
          cloned[timeIndex + i] = (a - b) % 256
        }

        ws.send(cloned, { binary: true })
      }
    })
  })

  wss.on('connection', (ws) => {
    ws.send(fragger.initialization, { binary: true })
    ws._init = true
    ws._initTime = null
    ws._initSeq = null
  })

  const main = ffmpeg()
    .addInput(address)
    .inputOptions([
      '-rtsp_transport tcp',
      '-rtsp_flags prefer_tcp',
      '-stimeout 30000000',
      '-re',
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
    .addOutput(fragger)
    .format('mp4')
    .outputOptions([
      // '-frag_duration 30000', -- enable realtime
      '-movflags +empty_moov+default_base_moof+frag_keyframe',
      '-reset_timestamps 1',
    ])
    .videoCodec('copy')
    .audioCodec('copy')
    .on('start', (cmd) => console.log('Command', cmd))
    .on('codecData', (data) => console.log('Codec data', data))
    .on('progress', (progress) => console.log('Processing', progress.frames, progress.timemark))
    .on('end', () => {
      console.log('main stream end')
      process.exit()
    })
    .on('error', (err, stdout, stderr) => {
      console.log('An error occurred', err.message, stdout, stderr)
      process.exit()
    })

  main.run()

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
      if (main) main.kill()
    } catch (err) {
      console.log(err)
    }

    try {
      if (wss) wss.close()
    } catch (err) {
      console.log(err)
    }
  })
}

try {
  start()
} catch (err) {
  console.log(err)
}