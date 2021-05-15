import path from "path"
import util from "util"
import chokidar from "chokidar"
import fs from "fs"
import { Database } from "shared/database"
import { config, dbConfig } from "shared/config"
import PQueue from "p-queue"
import rimrafCb from "rimraf"

const rimraf = util.promisify(rimrafCb)

const db = new Database(dbConfig)
const queue = new PQueue({ concurrency: 1 })

const wait = (delay: number) =>
  new Promise((resolve) => setTimeout(resolve, delay))

async function readNonEmptyFile(target: string) {
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

const cleanup = async () => {
  async function task() {
    for (const cameraKey of Object.keys(config.targets)) {
      console.log("Cleanup", cameraKey)

      const now = new Date()
      const nowTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        now.getHours(),
        0,
        0,
        0
      ).valueOf()

      try {
        await queue.add(async () => db.remove(cameraKey, config.maxAge), {
          priority: 1,
        })
        console.log("Deleted from DB", cameraKey)

        const cameraFolder = path.resolve(config.base, cameraKey)
        const folders = (await fs.promises.readdir(cameraFolder))
          .filter((folderName) => {
            const [year, month, day, hour] = folderName
              .split("_")
              .map((num) => Number.parseInt(num, 10))

            const folderTime = new Date(year, month - 1, day, hour, 0, 0, 0)
            const cleanupTime = folderTime.valueOf() + config.maxAge * 1000
            return cleanupTime <= nowTime
          })
          .map((folder) => path.resolve(cameraFolder, folder))

        await queue.addAll(
          folders.map((target) => () => rimraf(target)),
          { priority: 0 }
        )
        console.log("Deleted from file system", cameraKey)
      } catch (err) {
        if (err.code !== "ENOENT") throw err
      }
    }
  }

  const loop = async () => {
    await task()
    console.log("Cleanup finished for now")
    await wait(config.cleanupPolling * 1000)
    loop()
  }

  loop()
}

function getFilesInManifest(manifest: string) {
  return manifest.split("\n").filter((line) => line.indexOf(".ts") >= 0)
}

function rightDiff(left: string[], right: string[]) {
  return right.filter((val) => !left.includes(val))
}

async function sync() {
  const cache: Record<string, string[]> = {}
  async function handleChange(targetFile: string) {
    const cameraKey = path
      .relative(config.base, targetFile)
      .split(path.sep)
      .shift()

    if (!cameraKey) return

    const file = await readNonEmptyFile(targetFile)
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
          { priority: 2 }
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

const main = async () => {
  cleanup()
  sync()
}

main()
