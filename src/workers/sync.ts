import path from "path"
import chokidar from "chokidar"
import fs from "fs"
import { Database } from "shared/database"
import { config, dbConfig } from "shared/config"
import PQueue from "p-queue"

const db = new Database(dbConfig)
const queue = new PQueue({ concurrency: 1 })

const wait = (delay: number) =>
  new Promise((resolve) => setTimeout(resolve, delay))

enum QueuePriority {
  REMOVE_FS = 0,
  REMOVE_DB = 1,
  INSERT_DB = 2,
}

async function cleanup() {
  async function taskCamera(cameraKey: string) {
    const now = new Date()
    const nowTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours()
    ).valueOf()

    const cleanupThreshold = nowTime - config.maxAge * 1000
    await queue.add(async () => db.remove(cameraKey, config.maxAge), {
      priority: QueuePriority.REMOVE_DB,
    })

    const cameraFolder = path.resolve(config.base, cameraKey)

    try {
      await fs.promises.stat(cameraFolder)
    } catch {
      return
    }

    const folders = (await fs.promises.readdir(cameraFolder))
      .filter((folderName) => {
        const [year, month, day, hour] = folderName
          .split("_")
          .map((num) => Number.parseInt(num, 10))
        const folderTime = new Date(year, month - 1, day, hour).valueOf()
        return folderTime <= cleanupThreshold
      })
      .map((folder) => path.resolve(cameraFolder, folder))

    await queue.addAll(
      folders.map((target) => async () => {
        try {
          return await fs.promises.rm(target, {
            recursive: true,
            force: true,
          })
        } catch {}
      }),
      { priority: QueuePriority.REMOVE_FS }
    )
  }

  async function task() {
    for (const cameraKey of Object.keys(config.targets)) {
      console.time(`Cleanup ${cameraKey}`)
      await taskCamera(cameraKey).finally(() => {
        console.timeEnd(`Cleanup ${cameraKey}`)
      })
    }
  }

  const loop = async () => {
    await task()
    await wait(config.cleanupPolling * 1000)
    loop()
  }

  loop()
}

async function sync() {
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
        await queue.add(
          () => {
            console.log("Insert", cameraKey, relative)
            return db.insert(cameraKey, relative)
          },
          { priority: QueuePriority.INSERT_DB }
        )
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
  console.error(err)
  process.exit(1)
})

cleanup()
sync()
