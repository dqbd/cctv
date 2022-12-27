import { NextApiRequest, NextApiResponse } from "next"
import { loadServerConfig } from "shared/config"
import { convertToXaddr } from "shared/onvif"

import { getScreenshot } from "shared/preview"
import { logger } from "utils/logger"
import { runMiddleware } from "utils/middleware"
import cors from "cors"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await runMiddleware(req, res, cors({ methods: ["GET", "HEAD"] }))

  const { config } = await loadServerConfig()
  const folder = req.query.folder as string
  const refresh = req.query.refresh as string

  const target = config.targets[folder]
  if (target == null) {
    return res.status(404).end()
  }

  const onvif = convertToXaddr(target.source)
  if (onvif == null) {
    return res.status(422).end()
  }

  try {
    const payload = await getScreenshot(onvif.xaddr, !!refresh)
    res.setHeader("Content-Type", "image/jpeg")
    res.setHeader("Content-Transfer-Encoding", "binary")
    res.send(payload)
  } catch (err) {
    logger.error(err)
    res.status(500).end()
  }
}
