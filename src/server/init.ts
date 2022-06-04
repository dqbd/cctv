import fs from "fs"
import path from "path"

import { Database } from "shared/database"
import { logger } from "utils/logger"
import { loadEnvConfig } from "@next/env"
import { loadServerConfig } from "shared/config"

async function init() {
  loadEnvConfig(path.resolve("."), false, logger)
  const { config, authConfig } = await loadServerConfig()
  const db = new Database(authConfig.database)

  try {
    for (const cameraKey in config.targets) {
      await db.initFolder(cameraKey)
      await fs.promises.mkdir(path.resolve(config.base, cameraKey), {
        recursive: true,
      })
    }
  } finally {
    await db.destroy()
  }

  return true
}

init()
