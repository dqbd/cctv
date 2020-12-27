const fetch = require("node-fetch")
const { getSnapshotUrl } = require("./onvif")

const SCREENSHOT_DELAY = 10 * 1000

const cache = new Map()

module.exports = {
  getScreenshot: async (onvif, refresh = false) => {
    if (!cache.has(onvif)) {
      cache.set(onvif, {
        timeout: 0,
        image: Buffer.from([]),
        url: await getSnapshotUrl(onvif),
      })
    }

    const now = Date.now()
    const cached = cache.get(onvif)
    const { timeout, url } = cached
    let { image } = cached

    if (timeout + SCREENSHOT_DELAY <= now || refresh) {
      try {
        image = await fetch(url).then((a) => a.buffer())
        cache.set(onvif, { timeout: now, image, url })
      } catch (err) {
        console.log(err)
      }
    }

    return image
  },
}
