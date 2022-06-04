import path from "path"
import chokidar from "chokidar"
import fs from "fs"
import { Database } from "shared/database"
import { config } from "shared/config"
import { wait } from "utils/wait"
import { logger } from "utils/logger"

const db = new Database(config.database)

async function sync() {
  logger.info("Sync start")
  const cache: Record<string, string[]> = {}

  function getFilesInManifest(manifest: string) {
    return manifest.split("\n").filter((line) => line.indexOf(".ts") >= 0)
  }

  function rightDiff(left: string[], right: string[]) {
    return right.filter((val) => !left.includes(val))
  }

  async function readManifest(target: string) {
    let content = ""
    let attempts = 0

    const delay = 100
    const maxAttempts = (config.segmentSize * 1000) / delay

    while (!content && attempts < maxAttempts) {
      content = await fs.promises.readFile(target, "utf-8")
      if (!content) await wait(delay)
      attempts += 1
    }
    return content
  }

  async function handleChange(targetFile: string) {
    const cameraKey = path
      .relative(config.base, targetFile)
      .split(path.sep)
      .shift()

    if (!cameraKey) return

    const file = await readManifest(targetFile)
    const manifest = getFilesInManifest(file)
    const baseFolder = path.resolve(config.base, cameraKey)

    if (cache[cameraKey]) {
      const toInsert = rightDiff(cache[cameraKey], manifest)

      for (const item of toInsert) {
        const relative = path.relative(baseFolder, item)
        logger.info(`[${cameraKey}]`, relative)
        return db.insert(cameraKey, relative)
      }
    }

    if (manifest.length > 0) {
      cache[cameraKey] = manifest
    }
  }

  chokidar
    .watch(
      Object.keys(config.targets).map((cameraKey) =>
        path.resolve(config.base, cameraKey, config.manifest)
      )
    )
    .on("add", handleChange)
    .on("change", handleChange)
}

process.on("unhandledRejection", (err) => {
  logger.error(err)
  process.exit(1)
})

process.on("exit", () => {
  logger.info("Sync shutdown")
})

sync()
