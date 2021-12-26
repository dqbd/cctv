module.exports = {
  base: "/cctv/storage",
  database: {
    client: "mysql2",
    connection: {
      host: "db",
      port: 3306,
      user: 'root',
      password: 'mysql',
      database: 'cctv'
    }
  },
  manifest: "manifest.m3u8",
  maxAge: 7 * 24 * 60 * 60,
  syncInterval: 60 * 60 /* sync time every day */,
  cleanupPolling: 60 /* every minute */,
  segmentSize: 3,
  targets: {
    VENKU: {
      name: "Venku",
      onvif: "http://192.168.2.168:8899",
    },
    STARY_VCHOD: {
      name: "Východ",
      onvif: "http://192.168.2.172:8899",
    },
    STARY_SPODNI: {
      name: "Pokladna",
      onvif: "http://192.168.2.176:8899",
    },
    VPREDU_VCHOD: {
      name: "Vchod",
      onvif: "http://192.168.2.180:8899",
    },
    VZADU_KOSILE: {
      name: "Košile",
      onvif: "http://192.168.2.184:8899",
    },
    VZADU_PROSTERADLA: {
      name: "Prostěradla",
      onvif: "http://192.168.2.164:8899",
    },
  },
}
