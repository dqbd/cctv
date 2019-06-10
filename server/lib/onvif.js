const { OnvifDevice } = require('node-onvif')

const initDevice = async (xaddr) => {
  if (!xaddr) throw Error('Unknown xaddr')

  const device = new OnvifDevice({ xaddr })
  await device.init()
  return device
}

module.exports = {
  getStreamUrl: async (xaddr) => {
    const { stream: { rtsp }} = (await initDevice(xaddr)).getCurrentProfile()
    return rtsp
  },
  
  getSnapshotUrl: async (xaddr) => {
    const { snapshot } = (await initDevice(xaddr)).getCurrentProfile()
    return snapshot
  }
}