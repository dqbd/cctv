import fs from "fs"
import path from "path"
import util from "util"
import mkdirp from "mkdirp"
import { Database } from "../lib/database"
import { getConfig } from "../lib/config"
const readdir = util.promisify(fs.readdir)
const config = getConfig()

const db = new Database()

const main = async () => {
  for (const cameraKey in config.targets) {
    console.log("Rebuilding", cameraKey)
    const folderTarget = path.resolve(config.base, cameraKey)
    mkdirp.sync(folderTarget)

    console.log("Reset folder", cameraKey)
    await db.resetFolder(cameraKey)

    console.log("Get folder list", cameraKey)
    const toInsert = (await readdir(folderTarget)).filter(
      (folder) => folder.indexOf("_") >= 0
    )

    for (const target of toInsert) {
      console.log("Insert folder", cameraKey)
      const files = (
        await readdir(path.resolve(folderTarget, target))
      ).map((file) => path.join(target, file))
      await db.insertFolder(cameraKey, target, files)
    }
  }
}

main()
