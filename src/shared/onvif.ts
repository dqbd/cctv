import { OnvifDevice } from "node-onvif"

const initDevice = async (xaddr: string) => {
  if (!xaddr) throw Error("Unknown xaddr")

  const device = new OnvifDevice({ xaddr })
  await device.init()
  return device
}

export async function getStreamUrl(xaddr: string) {
  const {
    stream: { rtsp },
  } = (await initDevice(xaddr)).getCurrentProfile()
  return rtsp
}

export async function getSnapshotUrl(xaddr: string) {
  const { snapshot } = (await initDevice(xaddr)).getCurrentProfile()
  return snapshot
}

export function convertToXaddr(source: string) {
  const url = new URL(source)
  if (url.protocol !== "onvif:") return null

  const username = url.username
  const password = url.password

  url.username = ""
  url.password = ""

  return {
    xaddr: url.toString().replace("onvif:", "http:"),
    hostname: url.hostname,
    username,
    password,
  }
}
