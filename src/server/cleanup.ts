import path from "path"
import fs from "fs"
import { Database } from "shared/database"
import { wait } from "utils/wait"
import { logger } from "utils/logger"
import { loadEnvConfig } from "@next/env"
import { loadServerConfig } from "shared/config"

async function cleanup() {
  loadEnvConfig(path.resolve("."), false, logger)
  const { baseFolder, config, authConfig } = await loadServerConfig()
  const db = new Database(authConfig.database)

  async function taskCamera(cameraKey: string) {
    const now = new Date()
    const nowTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours()
    ).valueOf()

    const cleanupThreshold = nowTime - config.maxAge * 1000
    await db.remove(cameraKey, config.maxAge)

    const cameraFolder = path.resolve(baseFolder, cameraKey)
    await fs.promises.stat(cameraFolder)

    const folders = (await fs.promises.readdir(cameraFolder))
      .filter((folderName) => {
        const [year, month, day, hour] = folderName
          .split("_")
          .map((num) => Number.parseInt(num, 10))
        const folderTime = new Date(year, month - 1, day, hour).valueOf()
        return folderTime <= cleanupThreshold
      })
      .map((folder) => path.resolve(cameraFolder, folder))

    await Promise.all(
      folders.map(
        (target) =>
          fs.promises.rm(target, { recursive: true, force: true })
      )
    )
  }

  async function task() {
    logger.info({ state: "Start" })
    for (const cameraKey of Object.keys(config.targets)) {
      await taskCamera(cameraKey)
    }
    logger.info({ state: "End" })
  }

  const loop = async () => {
    await task()
    await wait(config.cleanupPolling * 1000)
    loop()
  }

  loop()
}

process.on("unhandledRejection", (err) => {
  logger.error({ err })
  process.exit(1)
})

process.on("exit", () => {
  logger.info({ state: "Shutdown" })
})

cleanup()
