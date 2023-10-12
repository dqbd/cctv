import path from "path"
import chokidar from "chokidar"
import fs from "fs"
import { Database } from "shared/database"
import { wait } from "utils/wait"
import { logger } from "utils/logger"
import { loadEnvConfig } from "@next/env"
import { loadServerConfig } from "shared/config"
import { MANIFEST } from "utils/constants"
import { parseManifest } from "shared/manifest"

async function sync() {
  loadEnvConfig(path.resolve("."), false, logger)
  const { baseFolder, config, authConfig } = await loadServerConfig()
  const db = new Database(authConfig.database)

  logger.info("Sync start")
  const cache: Record<string, string[]> = {}

  function rightDiff(left: string[], right: string[]) {
    return right.filter((val) => !left.includes(val))
  }

  async function readManifest(target: string) {
    let content = ""
    let attempts = 0

    const delay = 100
    const maxAttempts = (10 * 1000) / delay

    while (!content && attempts < maxAttempts) {
      content = await fs.promises.readFile(target, "utf-8")
      if (!content) await wait(delay)
      attempts += 1
    }
    return content
  }

  async function handleChange(targetFile: string) {
    const cameraKey = path
      .relative(baseFolder, targetFile)
      .split(path.sep)
      .shift()

    if (!cameraKey) return

    const file = await readManifest(targetFile)
    const manifest = parseManifest(file)
    if (manifest == null) return

    const cameraFolder = path.resolve(baseFolder, cameraKey)

    if (cache[cameraKey]) {
      const toInsert = rightDiff(cache[cameraKey], manifest.files)

      for (const item of toInsert) {
        const index = manifest.files.indexOf(item)
        const relative = path.relative(cameraFolder, item)
        logger.debug(`[${cameraKey}]: ${relative} ${index}`)
        return db.insert(
          cameraKey,
          manifest.targetDuration,
          relative,
          manifest.pdts[index],
        )
      }
    }

    if (manifest.files.length > 0) {
      cache[cameraKey] = manifest.files
    }
  }

  chokidar
    .watch(
      Object.keys(config.targets).map((cameraKey) =>
        path.resolve(baseFolder, cameraKey, MANIFEST),
      ),
      // use polling instead, as sometimes chokidar
      // just stops detecting new changes
      // this might not work...
      { usePolling: true },
    )
    .on("add", handleChange)
    .on("change", handleChange)
    .on("error", (error) => {
      logger.error(error)
    })
}

process.on("unhandledRejection", (err) => {
  logger.error(err)
  process.exit(1)
})

process.on("exit", () => {
  logger.info("Sync shutdown")
})

sync()
