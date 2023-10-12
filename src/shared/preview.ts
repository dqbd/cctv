import { getSnapshotUrl } from "shared/onvif"
import fetch from "node-fetch"

const SCREENSHOT_DELAY = 10 * 1000
const cache = new Map()

export async function getScreenshot(onvif: string, refresh = false) {
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
    image = await fetch(url).then((a) => a.buffer())
    cache.set(onvif, { timeout: now, image, url })
  }

  return image
}
