import path from "path"
import util from "util"
import chokidar from "chokidar"
import fs from "fs"
import { Database } from "../lib/database"
import { getConfig } from "../lib/config"

const readFile = util.promisify(fs.readFile)
const config = getConfig()

const db = new Database(config.auth.database)
const wait = (delay: number) =>
  new Promise((resolve) => setTimeout(resolve, delay))

async function readNonEmptyFile(target: string) {
  let content: string = ""
  let attempts = 0

  const delay = 100
  const maxAttempts = (config.segmentSize * 1000) / delay

  while (!content && attempts < maxAttempts) {
    content = await readFile(target, "utf-8")
    if (!content) await wait(delay)
  }
  return content
}

const main = async () => {
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
        await db.insert(cameraKey, relative)
      }
    }

    if (manifest && manifest.length > 0) manifestCache[cameraKey] = manifest
  }

  chokidar.watch(manifests).on("add", handleChange).on("change", handleChange)
}

main()
