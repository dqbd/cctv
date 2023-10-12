import { NextApiRequest, NextApiResponse } from "next"
import { loadServerConfig } from "shared/config"
import { createPersistentDatabase } from "shared/database"
import { runMiddleware } from "utils/middleware"
import cors from "cors"
import { z } from "zod"

const dbRef = createPersistentDatabase()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  await runMiddleware(req, res, cors({ methods: ["POST", "HEAD"] }))

  const { authConfig } = await loadServerConfig()
  const db = dbRef.create(authConfig.database)

  const json = z.string().parse(req.body)
  const folder = req.query.folder as string

  await db.insertLog(folder, json)
  res.send({ time: Date.now() })
}
