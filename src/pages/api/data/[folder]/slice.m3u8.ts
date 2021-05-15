import { NextApiRequest, NextApiResponse } from "next"
import { config, dbConfig } from "shared/config"
import { Database } from "shared/database"
import { getManifest } from "shared/manifest"
import { createSegments } from "shared/segment"
import { registerService } from "utils/service"

const db = registerService("db", () => new Database(dbConfig))

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

  const items = createSegments(
    (await db.seek(folder, from, to)).map((item) => item.path)
  )

  res.setHeader("Content-Type", "application/x-mpegURL")
  res.send(getManifest(config, items, 1, true))
}
