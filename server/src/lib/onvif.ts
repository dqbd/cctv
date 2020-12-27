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

export async function getSnapshotUrl (xaddr: string) {
  const { snapshot } = (await initDevice(xaddr)).getCurrentProfile()
  return snapshot
}