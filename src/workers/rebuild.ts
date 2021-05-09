import fs from "fs"
import path from "path"
import mkdirp from "mkdirp"
import { Database } from "shared/database"
import { config } from "shared/config"

const db = new Database()

const main = async () => {
  for (const cameraKey in config.targets) {
    console.log("Rebuilding", cameraKey)
    const folderTarget = path.resolve(config.base, cameraKey)
    mkdirp.sync(folderTarget)

    console.log("Reset folder", cameraKey)
    await db.resetFolder(cameraKey)

    console.log("Get folder list", cameraKey)
    const toInsert = (await fs.promises.readdir(folderTarget)).filter(
      (folder) => folder.indexOf("_") >= 0
    )

    for (const target of toInsert) {
      console.log("Insert folder", cameraKey)
      const files = (
        await fs.promises.readdir(path.resolve(folderTarget, target))
      ).map((file) => path.join(target, file))

      console.log("Insert", cameraKey, target, files.length)
      await db.insertFolder(cameraKey, target, files)
    }
  }
}

main()
