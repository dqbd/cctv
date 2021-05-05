import express from "express"
import path from "path"
import cors from "cors"
import fs from "fs"

import { Database } from "../lib/database"
import { Manifest } from "../lib/manifest"
import { Smooth } from "../lib/smooth"
import { getScreenshot } from "../lib/preview"
import { getConfig } from "../lib/config"
import { createSegment, Segment } from "../lib/segment"

const config = getConfig()

const main = async () => {
  const manifest = new Manifest(config)
  const db = new Database()

  const smooth = new Smooth(db)
  const app = express()

  app.use(cors())

  app.get("/streams", (_, res) => {
    res.set("Content-Type", "application/json")
    res.send({
      data: Object.entries(config.targets).map(([key, { name }]) => ({
        key,
        name,
      })),
    })
  })

  app.get("/data/:folder/slice.m3u8", async (req, res, next) => {
    if (!req.query.from) return next()
    const { folder } = req.params
    let { from, to, length } = req.query

    if (!folder || !from || (!to && !length) || typeof from !== "string")
      return res.status(400).send("No query parameters set")
    if(to && length)
      return res.status(400).send("Invalid parameters, can't have `to` and `length` at the same time")

    if(length) to = from + length

    const items = (await db.seek(folder, Number(from), Number(to)))
      .map((item) => createSegment(item.path))
      .filter((x): x is Segment => {
        return x != null
      })
    
    res.set("Content-Type", "application/x-mpegURL")
    res.send(manifest.getManifest(items, 1, true))
  })

  app.get("/data/:folder/stream.m3u8", async (req, res) => {
    const { folder } = req.params
    let shift = (req.query.shift && Number(req.query.shift)) || 0
    if(req.query.from && Number(req.query.from))
      shift = (Date.now() / 1000) - Number(req.query.from) + shift;

    if (!folder) return res.status(400).send("Invalid parameters")
    res.set("Content-Type", "application/x-mpegURL")

    if (shift === 0) {
      const file = fs.readFileSync(
        path.resolve(config.base, folder, config.manifest),
        { encoding: "utf-8" }
      )
      res.send(file.split(config.base).join("/data"))
    } else {
      const { segments, seq } = await smooth.seek(folder, shift)
      res.send(manifest.getManifest(segments, seq))
    }
  })

  app.get("/data/:folder/:date/:file", (req, res, next) => {
    const { folder, date, file } = req.params
    if (file.indexOf(".ts") < 0) return next()
    res.sendFile(path.join(folder, date, file), { root: config.base })
  })

  app.get("/frame/:folder", async (req, res) => {
    const { folder } = req.params
    const { refresh } = req.query

    if (!(folder in config.targets)) {
      res.status(404)
      res.send()
      return
    }

    try {
      const payload = await getScreenshot(
        config.targets[folder].onvif,
        !!refresh
      )
      res.setHeader("Content-Type", "image/jpeg")
      res.setHeader("Content-Transfer-Encoding", "binary")
      res.send(payload)
    } catch (err) {
      console.log(err)
      res.status(500)
      res.send()
    }
  })

  app.use(
    express.static(path.resolve(__dirname, "../../../", "client", "build"))
  )

  app.get("*", (_, res) =>
    res.sendFile(
      path.resolve(__dirname, "../../../", "client", "build", "index.html")
    )
  )

  app.listen(config.port, () => `Listening at ${config.port}`)
}

main()
