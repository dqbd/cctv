import { NextApiRequest, NextApiResponse } from "next"

import { createPersistentDatabase } from "shared/database"
import { Segment, getManifest, isSegment } from "shared/manifest"
import { loadServerConfig } from "shared/config"

const dbRef = createPersistentDatabase()

function parseNumberQuery(value: string | string[] | undefined) {
  if (typeof value === "string") {
    return Number(value)
  }
  return undefined
}
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authConfig } = await loadServerConfig()
  const db = dbRef.create(authConfig.database)

  const folder = req.query.folder as string
  if (!folder) return res.status(400).send("Missing from parameter")

  const from = parseNumberQuery(req.query.from)
  let to = parseNumberQuery(req.query.to)
  const length = parseNumberQuery(req.query.length)

  if (from == null || (to == null && length == null))
    return res.status(400).send("No query parameters set")

  if (to != null && length != null)
    return res
      .status(400)
      .send("Invalid parameters, can't have `to` and `length` at the same time")

  if (length) to = from + length

  if (to == null) return res.status(400).send("Missing to parameter")

  const items = (await db.seek(folder, from, to))
    .map((item) => Segment.parseSegment(item.path, item.targetDuration))
    .filter(isSegment)

  res.setHeader("Content-Type", "application/x-mpegURL")
  res.send(getManifest(items, { end: true }))
}
