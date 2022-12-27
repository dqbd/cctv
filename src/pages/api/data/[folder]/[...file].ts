import path from "path"
import send from "send"
import { NextApiRequest, NextApiResponse } from "next"
import { loadServerConfig } from "shared/config"
import { runMiddleware } from "utils/middleware"
import cors from "cors"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await runMiddleware(req, res, cors({ methods: ["GET", "HEAD"] }))

  const { baseFolder } = await loadServerConfig()

  const folder = req.query.folder as string
  const file = req.query.file as string[]
  const target = path.join(folder, ...file)

  if (path.parse(target).ext !== ".ts") {
    return res.status(404).end()
  }

  await new Promise((resolve, reject) => {
    const stream = send(req, target, { root: baseFolder })
    stream.on("end", resolve)
    stream.on("error", (err) => {
      if (err.statusCode) {
        res.status(err.statusCode).end()
      } else {
        reject(err)
      }
    })
    stream.pipe(res)
  })
}
