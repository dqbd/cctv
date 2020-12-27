const path = require("path")
const util = require("util")
const chokidar = require("chokidar")
const fs = require("fs")
const readFile = util.promisify(fs.readFile)

const Database = require("../lib/database.js")
const config = require("../config.js")

const db = new Database(config.auth.database)
const wait = (delay) => new Promise((resolve) => setTimeout(resolve, delay))

const readNonEmptyFile = async (...args) => {
  let content = ""
  let attempts = 0

  const delay = 100
  const maxAttempts = (config.segmentSize * 1000) / delay

  while (!content && attempts < maxAttempts) {
    content = await readFile(...args)
    if (!content) await wait(delay)
  }
  return content
}

const main = async () => {
  const manifests = Object.keys(config.targets).map((cameraKey) => {
    return path.resolve(config.base, cameraKey, config.manifest)
  })

  const filesOfManifest = (manifest) =>
    manifest.split("\n").filter((line) => line.indexOf(".ts") >= 0)
  const rdiff = (left, right) => right.filter((val) => !left.includes(val))
  const manifestCache = {}

  const handleChange = async (target) => {
    const cameraKey = path.relative(config.base, target).split(path.sep).shift()
    const file = await readNonEmptyFile(target, "utf-8")
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

  process.on("exit", () => {
    client.close()
  })
}

main()
