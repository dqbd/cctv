import path from "path"
import send from "send"
import { NextApiRequest, NextApiResponse } from "next"
import { getConfig } from "shared/config"

const config = getConfig()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const folder = req.query.folder as string
  const date = req.query.date as string
  const file = req.query.file as string

  if (file.indexOf(".ts") < 0) {
    return res.status(404).end()
  }

  const target = path.join(folder, date, file)
  await new Promise((resolve, reject) => {
    const stream = send(req, target, { root: config.base })
    stream.on("end", resolve)
    stream.on("error", reject)
    stream.pipe(res)
  })
}
