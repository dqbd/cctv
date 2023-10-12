import { NextApiRequest, NextApiResponse } from "next"
import { loadServerConfig } from "shared/config"
import { createPersistentDatabase } from "shared/database"
import { runMiddleware } from "utils/middleware"
import cors from "cors"

const dbRef = createPersistentDatabase()

const RANGE = 10 * 60 // 20s

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  await runMiddleware(req, res, cors({ methods: ["GET", "HEAD"] }))

  const { authConfig } = await loadServerConfig()
  const db = dbRef.create(authConfig.database)

  const folder = req.query.folder as string
  const shift = Number(req.query.shift || 0)

  if (!folder) return res.status(400).send("Invalid parameters")
  const timestampSec = Math.floor((Date.now() - shift * 1000) / 1000)

  res.send(
    await db.logRange(folder, timestampSec - RANGE, timestampSec + RANGE),
  )
}
