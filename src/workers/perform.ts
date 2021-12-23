import { config, authConfig } from "shared/config"
import { getStreamUrl } from "shared/onvif"
import { setSystemTime } from "shared/clocksync"

import path from "path"
import mkdirp from "mkdirp"
import ffmpeg from "fluent-ffmpeg"

const cameraKey = process.argv.slice().pop()
if (!cameraKey) throw Error("Invalid camera key")

const target = config.targets[cameraKey]
if (!target) throw Error("Invalid camera target")

const credential = authConfig.onvif
const baseFolder = path.resolve(config.base, cameraKey)
mkdirp.sync(baseFolder)

function timeSyncLoop(hostname: string | null) {
  let timeSyncTimer: NodeJS.Timeout

  async function timeSync() {
    if (hostname != null) {
      clearTimeout(timeSyncTimer)
      try {
        console.time(`Time Sync`)
        await setSystemTime(credential, hostname).finally(() => {
          console.timeEnd(`Time Sync`)
        })
      } catch (err) {
        console.error(`Failed to set ${cameraKey} time:`, err)
      }
      timeSyncTimer = setTimeout(timeSync, 60 * 1000)
    }
  }

  timeSync()

  return {
    destroy: () => clearTimeout(timeSyncTimer),
  }
}

function staleFrameLoop() {
  let staleFrameTimer: NodeJS.Timeout
  let lastFrameCount = -1

  function trigger() {
    console.error(
      `Stale FFMPEG (frame=${lastFrameCount}), no new frames received`
    )
    process.exit(3)
  }

  function onFrame(frame: number) {
    if (frame !== lastFrameCount) {
      clearTimeout(staleFrameTimer)
      staleFrameTimer = setTimeout(trigger, 60 * 60 * 1000)
    }

    lastFrameCount = frame
  }

  onFrame(0)
  return {
    onFrame,
    destroy: () => clearTimeout(staleFrameTimer),
  }
}

async function main() {
  const address = await getStreamUrl(target.onvif)
  const hostname = new URL(address).hostname

  const timeSync = timeSyncLoop(hostname)
  const staleFrame = staleFrameLoop()

  const main = ffmpeg()
    .addInput(address)
    .inputOptions(["-stimeout 30000000", "-rtsp_transport tcp"])
    .addOutput(path.resolve(baseFolder, config.manifest))
    .audioCodec("copy")
    .videoCodec("copy")
    .outputOptions([
      `-hls_time ${config.segmentSize}`,
      `-use_localtime_mkdir 1`,
      `-hls_start_number_source epoch`,
      `-use_localtime 1`,
      `-hls_flags second_level_segment_duration`,
      `-hls_segment_filename ${path.resolve(
        baseFolder,
        "%Y_%m_%d_%H/sg_%s_%%t.ts"
      )}`,
    ])
    .on("start", (cmd) => console.debug("Command", cmd))
    .on("codecData", (data) => console.debug("Codec data", data))
    .on("progress", (progress) => {
      console.debug("Processing", progress.frames, progress.timemark)
      staleFrame.onFrame(progress.frames)
    })
    .on("end", () => {
      console.error("Stream end on FFMPEG side")
      process.exit(2)
    })
    .on("error", (err, stdout, stderr) => {
      console.error("FFMPEG error", err.message, stdout, stderr)
      process.exit(1)
    })

  main.run()

  process.on("exit", () => {
    timeSync.destroy()
    staleFrame.destroy()
    main.kill("SIGKILL")
  })
}

main()
