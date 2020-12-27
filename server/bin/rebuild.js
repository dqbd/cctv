const fs = require("fs")
const path = require("path")
const util = require("util")
const mkdirp = require("mkdirp")
const Database = require("../lib/database.js")
const readdir = util.promisify(fs.readdir)

const config = require("../config.js")

const db = new Database(config.auth.database)

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

  db.close()
}

main()
