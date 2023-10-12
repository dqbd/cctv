import { NextApiRequest, NextApiResponse } from "next"
import { runMiddleware } from "utils/middleware"
import cors from "cors"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  await runMiddleware(req, res, cors({ methods: ["GET", "HEAD"] }))

  res.send({ time: Date.now() })
}
