import fs from "fs"
import path from "path"
import { NextApiRequest, NextApiResponse } from "next"
import { loadServerConfig } from "shared/config"
import { createPersistentDatabase } from "shared/database"
import { getManifest, isSegment, Segment } from "shared/manifest"
import { MANIFEST } from "utils/constants"

const dbRef = createPersistentDatabase()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { baseFolder, authConfig } = await loadServerConfig()
  const db = dbRef.create(authConfig.database)

  const folder = req.query.folder as string
  const shift = Number(req.query.shift || 0)

  if (!folder) return res.status(400).send("Invalid parameters")
  res.setHeader("Content-Type", "application/x-mpegURL")

  if (shift === 0) {
    const target = path.resolve(baseFolder, folder, MANIFEST)
    if (!target.startsWith(baseFolder)) return res.status(400).end()

    const file = await fs.promises.readFile(target, { encoding: "utf-8" })
    const transformed = file
      .split("\n")
      .map((line) =>
        line.startsWith(baseFolder)
          ? path.relative(path.join(baseFolder, folder), line)
          : line
      )
      .join("\n")

    res.send(transformed)
  } else {
    const timestampSec = Math.floor((Date.now() - shift * 1000) / 1000)
    const segments = (await db.seekFrom(folder, timestampSec))
      .map((item) =>
        Segment.parseSegment(item.path, item.targetDuration, item.pdt)
      )
      .filter(isSegment)

    const firstSegmentSec = segments[0].getDate().valueOf() / 1000
    const offsetSec = Math.max(0, timestampSec - firstSegmentSec)

    res.send(getManifest(segments, { offset: offsetSec }))
  }
}
