import path from "path"
import util from "util"
import { Database } from "../lib/database.js"
import { getConfig } from "../lib/config"

const readdir = util.promisify(require("fs").readdir)
const rimraf = util.promisify(require("rimraf"))

const config = getConfig()
const db = new Database()

const wait = (delay: number) =>
  new Promise((resolve) => setTimeout(resolve, delay))

const main = async () => {
  const cleanup = async () => {
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
        const folders = (await readdir(baseFolder)).filter(
          (folderName: string) => {
            const [year, month, day, hour] = folderName
              .split("_")
              .map((num) => Number.parseInt(num, 10))
            const folderTime = new Date(
              year,
              month - 1,
              day,
              hour,
              0,
              0,
              0
            ).valueOf()
            const cleanupTime = folderTime + config.maxAge * 1000
            return cleanupTime <= nowTime
          }
        )

        await folders.reduce((memo: Promise<void>, folder: string) => {
          return memo.then(() => {
            const target = path.resolve(baseFolder, folder)
            return rimraf(target)
          })
        }, Promise.resolve())

        console.log("Deleted folders", folders && folders.join(", "))

        await db.removeOldScenesAndMotion(cameraKey, config.maxAge)
        console.log("Deleted from DB", cameraKey)
      } catch (err) {
        if (err.code !== "ENOENT") throw err
      }
    }
  }

  const loop = async () => {
    await cleanup()
    console.log("Cleanup finished for now")
    await wait(config.cleanupPolling * 1000)
    loop()
  }

  loop()
}

main()
