import { NextApiRequest, NextApiResponse } from "next"

import { createPersistentDatabase } from "shared/database"
import { loadServerConfig } from "shared/config"
import { runMiddleware } from "utils/middleware"
import cors from "cors"

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
  await runMiddleware(req, res, cors({ methods: ["GET", "HEAD"] }))

  const { authConfig } = await loadServerConfig()
  const db = dbRef.create(authConfig.database)

  const folder = req.query.folder as string
  if (!folder) return res.status(400).send("Missing from parameter")

  const fromSec = parseNumberQuery(req.query.from)
  let toSec = parseNumberQuery(req.query.to)
  const length = parseNumberQuery(req.query.length)

  if (fromSec == null || (toSec == null && length == null))
    return res.status(400).send("No query parameters set")

  if (toSec != null && length != null)
    return res
      .status(400)
      .send("Invalid parameters, can't have `to` and `length` at the same time")

  if (length) toSec = fromSec + length

  if (toSec == null) return res.status(400).send("Missing to parameter")

  res.send(await db.logRange(folder, fromSec, toSec))
}
