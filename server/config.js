const auth = require("./auth.json")

module.exports = {
  base: "/media/linaro/cctv",
  manifest: "manifest.m3u8",
  segmentName: "%Y_%m_%d_%H/sg_%s_%%t.ts",
  maxAge: 7 * 24 * 60 * 60,
  syncInterval: 60 * 60 /* sync time every day */,
  cleanupPolling: 60 /* every minute */,
  segmentSize: 3,
  port: 80,
  targets: {
    VENKU: {
      name: "Venku",
      onvif: "http://192.168.2.168:8899",
    },
    STARY_VCHOD: {
      name: "Starý - vchod",
      onvif: "http://192.168.2.172:8899",
    },
    STARY_SPODNI: {
      name: "Starý - spodní prádlo",
      onvif: "http://192.168.2.176:8899",
    },
    VPREDU_VCHOD: {
      name: "Vpředu - vchod",
      onvif: "http://192.168.2.180:8899",
    },
    VZADU_KOSILE: {
      name: "Vzadu - košile",
      onvif: "http://192.168.2.184:8899",
    },
    VZADU_PROSTERADLA: {
      name: "Vzadu - prostěradlo",
      onvif: "http://192.168.2.164:8899",
    },
    DEBUG: {
      name: "Debug Camera",
      onvif: "http://192.168.1.158:8899",
    },
  },
  auth,
  credential: {
    username: "admin",
    password: "",
  }
}
