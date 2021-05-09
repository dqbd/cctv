import fs from "fs"
import path from "path"
import { NextApiRequest, NextApiResponse } from "next"
import { config } from "shared/config"
import { registerService } from "utils/service"
import { Database } from "shared/database"
import { Smooth } from "shared/smooth"
import { getManifest } from "shared/manifest"

const db = registerService("db", () => new Database())
const smooth = registerService("smooth", () => new Smooth())

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const folder = req.query.folder as string
  let shift = Number(req.query.shift || 0)
  if (Number(req.query.from || 0)) {
    shift += Date.now() / 1000 - Number(req.query.from || 0)
  }

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
    const { segments, seq } = await smooth.seek(db, folder, shift)
    res.send(getManifest(config, segments, seq))
  }
}
