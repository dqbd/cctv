/* eslint-disable no-console */
import fs from "fs"
import path from "path"
import { Database } from "shared/database"
import { config, dbConfig } from "shared/config"

const db = new Database(dbConfig)

const main = async () => {
  for (const cameraKey in config.targets) {
    console.log("Rebuilding", cameraKey)

    console.log("- Init table")
    await db.initFolder(cameraKey)

    console.log("- Creating folder")
    const folderTarget = path.resolve(config.base, cameraKey)
    await fs.promises.mkdir(folderTarget, { recursive: true })

    console.log("- Reset folder")
    await db.resetFolder(cameraKey)

    console.log("- Reading folder list")
    const toInsert = (await fs.promises.readdir(folderTarget)).filter(
      (folder) => folder.indexOf("_") >= 0
    )

    for (const target of toInsert) {
      console.log("- Reading folder", target)
      const files = (
        await fs.promises.readdir(path.resolve(folderTarget, target))
      ).map((file) => path.join(target, file))

      console.log("- Inserting", target, files.length)
      await db.insertFolder(cameraKey, target, files)
    }
  }

  await db.destroy()
}

main()
