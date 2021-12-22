import fs from "fs"
import path from "path"
import runAll from "npm-run-all"

import { Database } from "shared/database"
import { config, dbConfig } from "shared/config"

const db = new Database(dbConfig)
const main = async () => {
  try {
    for (const cameraKey in config.targets) {
      await db.initFolder(cameraKey)
      const folderTarget = path.resolve(config.base, cameraKey)
      await fs.promises.mkdir(folderTarget, { recursive: true })
    }

    await db.destroy()

    await runAll(["start:*"], {
      parallel: true,
      printLabel: true,
      silent: true,
      stdout: process.stdout,
      stderr: process.stderr,
    })
  } catch (err) {
    console.error(err)
  }
}

main()
