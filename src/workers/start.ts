import fs from "fs"
import path from "path"
import runAll from "npm-run-all"

import { Database } from "shared/database"
import { config, dbConfig } from "shared/config"

async function init() {
  const db = new Database(dbConfig)
  try {
    for (const cameraKey in config.targets) {
      await db.initFolder(cameraKey)
      const folderTarget = path.resolve(config.base, cameraKey)
      await fs.promises.mkdir(folderTarget, { recursive: true })
    }
  } catch (err) {
    console.error(err)
    return false
  } finally {
    await db.destroy()
  }

  return true
}

async function main() {
  if (!(await init())) {
    return process.exit(1)
  }

  const scripts = process.argv.includes("--dev")
    ? ["process:*"]
    : ["start:*", "process:*"]

  try {
    await runAll(scripts, {
      parallel: true,
      printLabel: true,
      silent: true,
      stdout: process.stdout,
      stderr: process.stderr,
    })
  } catch (err) {
    console.error(err)
    process.exit(2)
  }
}

main()
