const ffmpeg = require('fluent-ffmpeg')
const config = require('../config.js')
const Database = require('../lib/database.js')

const db = new Database(config.auth.mysql)

const cameraKey = process.argv.slice().pop()
const target = config.targets[cameraKey]

if (!target) throw Error('Invalid argument')

const start = async () => {
  console.log('Starting preview', cameraKey)
  const preview = ffmpeg(target.preview)
    .inputOptions([
      '-rtsp_transport tcp',
      '-rtsp_flags prefer_tcp',
      '-stimeout 30000000',
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

        db.addScene(cameraKey, value)
      }
    })
    .on('codecData', (data) => console.log('Codec data preview', data))
    .on('end', () => {
      console.log('preview stream end')
      process.exit()
    })
    .on('error', (err) => {
      console.log('An error occurred in preview', err.message)
      process.exit()
    })
    .addOutput('/dev/null')
    .outputOptions(['-f null'])

  preview.run()

  process.on('exit', () => {
    console.log('Closing preview', cameraKey)

    try {
      if (preview) preview.kill()
    } catch (err) {
      console.log(err)
    }
  })
}

start()