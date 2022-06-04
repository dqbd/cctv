import { NextApiRequest, NextApiResponse } from "next"
import { loadServerConfig } from "shared/config"

import { getScreenshot } from "shared/preview"
import { logger } from "utils/logger"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { config } = await loadServerConfig()
  const folder = req.query.folder as string
  const refresh = req.query.refresh as string

  if (!(folder in config.targets)) {
    return res.status(404).end()
  }

  try {
    const payload = await getScreenshot(config.targets[folder].onvif, !!refresh)
    res.setHeader("Content-Type", "image/jpeg")
    res.setHeader("Content-Transfer-Encoding", "binary")
    res.send(payload)
  } catch (err) {
    logger.error(err)
    res.status(500).end()
  }
}
