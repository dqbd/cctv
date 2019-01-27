module.exports = {
    base: "/media/linaro/cctv",
    manifest: "manifest.m3u8",
    segmentName: "sg_%s_%%t.ts",
    maxAge: 7 * 24 * 60 * 60, /* emergency mode, only a day, reduce if still issucifient*/
    cleanupPolling: 60, /* every minute */
    segmentSize: 3,
    port: 80,
    wanPort: 8080,
    targets: {
        VENKU: {
            name: "Venku",
            source: "rtsp://192.168.2.168:554/user=admin&password=&channel=1&stream=0.sdp?real_stream"
        },
        STARY_VCHOD: {
            name: "Starý - vchod",
            source: "rtsp://192.168.2.172:554/user=admin&password=&channel=1&stream=0.sdp?real_stream"
        },
        STARY_SPODNI: {
            name: "Starý - spodní prádlo",
            source: "rtsp://192.168.2.176:554/user=admin&password=&channel=1&stream=0.sdp?real_stream"
        },
        VPREDU_VCHOD: {
            name: "Vpředu - vchod",
            source: "rtsp://192.168.2.180:554/user=admin&password=&channel=1&stream=0.sdp?real_stream"
        },
        VZADU_KOSILE: {
            name: "Vzadu - košile",
            source: "rtsp://192.168.2.184:554/user=admin&password=&channel=1&stream=0.sdp?real_stream"
        },
        VZADU_PROSTERADLA: {
            name: "Vzadu - prostěradlo",
            source: "rtsp://192.168.2.164:554/user=admin&password=&channel=1&stream=0.sdp?real_stream"
        }
    },
    syncInterval: 60 * 60, /* sync time every day */
    credential: {
        username: 'admin',
        password: ''
    }
}
