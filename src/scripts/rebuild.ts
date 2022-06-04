import fs from "fs"
import path from "path"
import { loadServerConfig } from "shared/config"
import { logger } from "utils/logger"
import { loadEnvConfig } from "@next/env"
import { Database } from "shared/database"

const main = async () => {
  loadEnvConfig(path.resolve("."), false, logger)
  const { config, authConfig } = await loadServerConfig()
  const db = new Database(authConfig.database)

  for (const cameraKey in config.targets) {
    logger.info("Rebuilding", cameraKey)

    logger.info("- Init table")
    await db.initFolder(cameraKey)

    logger.info("- Creating folder")
    const folderTarget = path.resolve(config.base, cameraKey)
    await fs.promises.mkdir(folderTarget, { recursive: true })

    logger.info("- Reset folder")
    await db.resetFolder(cameraKey)

    logger.info("- Reading folder list")
    const toInsert = (await fs.promises.readdir(folderTarget)).filter(
      (folder) => folder.indexOf("_") >= 0
    )

    for (const target of toInsert) {
      logger.info("- Reading folder", target)
      const files = (
        await fs.promises.readdir(path.resolve(folderTarget, target))
      ).map((file) => path.join(target, file))

      logger.info("- Inserting", target, files.length)
      await db.insertFolder(cameraKey, target, files)
    }
  }

  await db.destroy()
}

main()
