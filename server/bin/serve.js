const express = require("express")
const path = require("path")
const cors = require("cors")
const fs = require("fs")

const Database = require("../lib/database")
const Manifest = require("../lib/manifest")
const Smooth = require("../lib/smooth")
const Preview = require("../lib/preview")

const config = require("../config.js")

const main = async () => {
  const manifest = new Manifest(config)
  const db = new Database(config.auth.database)

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

  app.get("/data/:folder/slice.m3u8", async (req, res) => {
    if (!req.query.from) return next()
    const { folder } = req.params
    const { from, to } = req.query

    if (!folder || !from || !to)
      return res.status(400).send("No query parameters set")

    res.set("Content-Type", "application/x-mpegURL")
    res.send(
      manifest.getManifest(
        `${from}${to}`,
        await db.seek(folder, from, to),
        1,
        true
      )
    )
  })

  app.get("/data/:folder/stream.m3u8", async (req, res) => {
    const { folder } = req.params
    let { shift = 0 } = req.query
    if (!folder) return res.status(400).send("Invalid parameters")
    const { seq, segments } = await smooth.seek(folder, shift)
    res.set("Content-Type", "application/x-mpegURL")

    if (shift === 0) {
      const file = fs.readFileSync(
        path.resolve(config.base, folder, config.manifest),
        { encoding: "UTF-8" }
      )
      res.send(file.split(config.base).join("/data"))
    } else {
      res.send(manifest.getManifest(shift, segments, seq))
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
      const payload = await Preview.getScreenshot(
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

  app.use(express.static(path.resolve(__dirname, "../../", "client", "build")))

  app.get("*", (_, res) =>
    res.sendFile(
      path.resolve(__dirname, "../../", "client", "build", "index.html")
    )
  )

  app.listen(config.port, () => `Listening at ${config.port}`)
}

main()
