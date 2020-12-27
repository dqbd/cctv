const url = require("url")
const path = require("path")
const mkdirp = require("mkdirp")
const ffmpeg = require("fluent-ffmpeg")
const ClockSync = require("../lib/clocksync")
const Onvif = require("../lib/onvif")

const config = require("../config.js")

const cameraKey = process.argv.slice().pop()
const target = config.targets[cameraKey]

if (!target) throw Error("Invalid argument")

const credential = config.credential

const baseFolder = path.resolve(config.base, cameraKey)
mkdirp.sync(baseFolder)

const start = async () => {
  const address = await Onvif.getStreamUrl(target.onvif)
  const hostname = url.parse(address).hostname

  const main = ffmpeg()
    .addInput(address)
    .inputOptions(["-stimeout 30000000"])
    .addOutput(path.resolve(baseFolder, config.manifest))
    .audioCodec("copy")
    .videoCodec("copy")
    .outputOptions([
      `-hls_time ${config.segmentSize}`,
      `-use_localtime_mkdir 1`,
      `-hls_start_number_source epoch`,
      `-use_localtime 1`,
      `-hls_flags second_level_segment_duration`,
      `-hls_segment_filename ${path.resolve(baseFolder, config.segmentName)}`,
    ])
    .on("start", (cmd) => console.log("Command", cmd))
    .on("codecData", (data) => console.log("Codec data", data))
    .on("progress", (progress) =>
      console.log("Processing", progress.frames, progress.timemark)
    )
    .on("stderr", console.log)
    .on("end", () => {
      console.log("main stream end")
      process.exit()
    })
    .on("error", (err, stdout, stderr) => {
      console.log("An error occurred", err.message, stdout, stderr)
      process.exit()
    })

  main.run()

  let timeSyncTimer = null
  const timeSync = async () => {
    clearTimeout(timeSyncTimer)
    console.time(`timeSync ${cameraKey}`)
    try {
      await ClockSync.setSystemTime(credential, hostname)
    } catch (err) {
      console.error(`failed to set ${cameraKey} time:`, err)
    }
    console.timeEnd(`timeSync ${cameraKey}`)
    timeSyncTimer = setTimeout(timeSync, 60 * 1000)
  }
  timeSync()

  process.on("exit", () => {
    console.log("Closing", cameraKey)
    clearTimeout(timeSyncTimer)

    try {
      if (main) main.kill()
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
