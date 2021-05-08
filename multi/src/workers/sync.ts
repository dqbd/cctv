import path from "path"
import util from "util"
import chokidar from "chokidar"
import fs from "fs"
import { Database } from "shared/database"
import { getConfig } from "shared/config"
import PQueue from "p-queue"

const rimraf = util.promisify(require("rimraf"))

const config = getConfig()
const db = new Database()
const queue = new PQueue({ concurrency: 1 })

const wait = (delay: number) =>
  new Promise((resolve) => setTimeout(resolve, delay))

async function readNonEmptyFile(target: string) {
  let content: string = ""
  let attempts = 0

  const delay = 100
  const maxAttempts = (config.segmentSize * 1000) / delay

  while (!content && attempts < maxAttempts) {
    content = await fs.promises.readFile(target, "utf-8")
    if (!content) await wait(delay)
  }
  return content
}

const cleanup = async () => {
  async function task() {
    for (const cameraKey of Object.keys(config.targets)) {
      console.log("Cleanup", cameraKey)
      const baseFolder = path.resolve(config.base, cameraKey)

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
        let folders = await fs.promises.readdir(baseFolder)
        folders = folders.filter((folderName: string) => {
          const [year, month, day, hour] = folderName
            .split("_")
            .map((num) => Number.parseInt(num, 10))
          const folderTime = new Date(year, month - 1, day, hour, 0, 0, 0)
          const cleanupTime = folderTime.valueOf() + config.maxAge * 1000
          return cleanupTime <= nowTime
        })

        await folders.reduce((memo: Promise<void>, folder: string) => {
          return memo.then(() => {
            const target = path.resolve(baseFolder, folder)
            return rimraf(target)
          })
        }, Promise.resolve())

        console.log("Deleted folders", folders && folders.join(", "))

        await queue.add(() =>
          db.removeOldScenesAndMotion(cameraKey, config.maxAge)
        )
        console.log("Deleted from DB", cameraKey)
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

async function sync() {
  const manifests = Object.keys(config.targets).map((cameraKey) => {
    return path.resolve(config.base, cameraKey, config.manifest)
  })

  const filesOfManifest = (manifest: string) =>
    manifest.split("\n").filter((line) => line.indexOf(".ts") >= 0)
  const rdiff = (left: string[], right: string[]) =>
    right.filter((val) => !left.includes(val))
  const manifestCache: { [key: string]: string[] } = {}

  const handleChange = async (targetFile: string) => {
    const cameraKey = path
      .relative(config.base, targetFile)
      .split(path.sep)
      .shift()
    if (!cameraKey) return

    const file = await readNonEmptyFile(targetFile)
    const manifest = filesOfManifest(file)

    const baseFolder = path.resolve(config.base, cameraKey)

    if (manifestCache[cameraKey]) {
      const toInsert = rdiff(manifestCache[cameraKey], manifest)

      for (let item of toInsert) {
        const relative = path.relative(baseFolder, item)
        await queue.add(() => db.insert(cameraKey, relative))
      }
    }

    if (manifest && manifest.length > 0) manifestCache[cameraKey] = manifest
  }

  chokidar.watch(manifests).on("add", handleChange).on("change", handleChange)
}

const main = async () => {
  cleanup()
  sync()
}

main()
