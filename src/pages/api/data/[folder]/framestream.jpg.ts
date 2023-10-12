import { NextApiRequest, NextApiResponse } from "next"

import { logger } from "utils/logger"
import { runMiddleware } from "utils/middleware"
import ffmpeg from "fluent-ffmpeg"
import cors from "cors"
import { wrapUrl } from "utils/url"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  await runMiddleware(req, res, cors({ methods: ["GET", "HEAD"] }))
  const folder = req.query.folder as string

  try {
    res.setHeader("Content-Type", "image/jpeg")
    res.setHeader("Content-Transfer-Encoding", "binary")

    ffmpeg()
      .addInput(
        wrapUrl(`http://127.0.0.1:3000/api/data/${folder}/stream.m3u8?shift=0`),
      )
      .frames(1)
      .format("image2")
      .on("error", (err) => res.status(500).send(err))
      .pipe(res)
  } catch (err) {
    logger.error(err)
    res.status(500).end()
  }
}
