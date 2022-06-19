import { convertToXaddr, getStreamUrl } from "shared/onvif"
import { setSystemTime } from "shared/clocksync"
import { logger } from "utils/logger"

import path from "path"
import mkdirp from "mkdirp"
import ffmpeg from "fluent-ffmpeg"

import { loadEnvConfig } from "@next/env"
import { loadServerConfig } from "shared/config"
import { MANIFEST } from "utils/constants"

function timeSyncLoop(credential: {
  username: string
  password: string
  hostname: string
}) {
  let timeSyncTimer: NodeJS.Timeout

  async function timeSync() {
    await setSystemTime(credential, credential.hostname)
  }

  async function loop() {
    clearTimeout(timeSyncTimer)
    try {
      await timeSync()
    } catch (err) {
      logger.error(err)
    }

    timeSyncTimer = setTimeout(timeSync, 60 * 1000)
  }

  return {
    destroy: () => clearTimeout(timeSyncTimer),

    launch: () => {
      new Promise((_, reject) => {
        try {
          loop()
        } catch (err) {
          reject(err)
        }
      })
    },
  }
}

function staleFrameLoop() {
  let staleFrameTimer: NodeJS.Timeout
  let lastFrameCount = -1

  function trigger() {
    logger.error(
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

async function launchWorker(cameraKey: string | undefined) {
  loadEnvConfig(path.resolve("."), false, logger)
  const { baseFolder, config } = await loadServerConfig()

  if (!cameraKey) throw Error("Invalid camera key")

  const target = config.targets[cameraKey]
  if (!target) throw Error("Invalid camera target")

  const cameraFolder = path.resolve(baseFolder, cameraKey)
  mkdirp.sync(cameraFolder)

  let address = target.source
  let timeSync: ReturnType<typeof timeSyncLoop> | undefined
  let staleFrame: ReturnType<typeof staleFrameLoop> | undefined

  const onvif = convertToXaddr(target.source)
  if (onvif != null) {
    address = await getStreamUrl(onvif.xaddr)
    timeSync = timeSyncLoop(onvif)
  }

  if (address == null) throw new Error("No address received")

  // use ffmpeg version 5
  const main = ffmpeg()
    .addInput(address)
    .inputOptions(["-timeout 30000000", "-rtsp_transport tcp"])
    .addOutput(path.resolve(cameraFolder, MANIFEST))
    .audioCodec("copy")
    .videoCodec("copy")
    .outputOptions([
      `-strftime_mkdir 1`,
      `-strftime 1`,
      `-hls_start_number_source epoch`,
      `-hls_flags second_level_segment_index+second_level_segment_duration`,
      `-hls_segment_filename ${path.resolve(
        cameraFolder,
        "%Y_%m_%d_%H/sg_%s_%%d_%%t.ts"
      )}`,
    ])

  try {
    staleFrame = staleFrameLoop()

    await new Promise((_, reject) => {
      main
        .on("start", (cmd) => logger.info(`Command ${cmd}`))
        .on("progress", (progress) => {
          logger.debug("Processing", progress.frames, progress.timemark)
          staleFrame?.onFrame(progress.frames)
        })
        .on("end", () => reject(new Error("Stream end on FFMPEG side")))
        .on("error", (err) => reject(new Error(`FFMPEG error: ${err.message}`)))
        .run()
    })
  } finally {
    timeSync?.destroy()
    staleFrame?.destroy()
    main.kill("SIGKILL")
  }
}

launchWorker(process.argv.slice().pop()).catch((err) => {
  logger.error(err)
  process.exit(1)
})
