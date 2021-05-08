import { NextApiRequest, NextApiResponse } from "next"
import { getConfig } from "shared/config"
import { getScreenshot } from "shared/preview"

const config = getConfig()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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
    // eslint-disable-next-line no-console
    console.log(err)
    res.status(500).end()
  }
}
