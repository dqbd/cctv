import fs from "fs"
import path from "path"
import { NextApiRequest, NextApiResponse } from "next"
import { loadServerConfig } from "shared/config"
import { Database } from "shared/database"
import { Smooth } from "shared/smooth"
import { getManifest } from "shared/manifest"

const smooth = new Smooth()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { config, authConfig } = await loadServerConfig()
  const db = new Database(authConfig.database)

  const folder = req.query.folder as string
  const shift = Number(req.query.shift || 0)

  if (!folder) return res.status(400).send("Invalid parameters")
  res.setHeader("Content-Type", "application/x-mpegURL")

  if (shift === 0) {
    const target = path.resolve(config.base, folder, config.manifest)
    if (!target.startsWith(config.base)) {
      return res.status(400).end()
    }

    const file = await fs.promises.readFile(target, { encoding: "utf-8" })
    const transformed = file
      .split("\n")
      .map((line) =>
        line.startsWith(config.base)
          ? path.relative(path.join(config.base, folder), line)
          : line
      )
      .join("\n")

    res.send(transformed)
  } else {
    const { segments, seq, offset } = await smooth.seek(db, folder, shift)
    res.send(getManifest(config, segments, seq, { offset }))
  }
}
