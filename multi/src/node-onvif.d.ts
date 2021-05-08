declare module "node-onvif" {
  class OnvifDevice {
    constructor(options: { xaddr: string })
    init(): Promise<unknown>
    getCurrentProfile(): {
      stream: {
        rtsp: string
      }
      snapshot: string
    }
  }
}
