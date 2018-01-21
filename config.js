module.exports = {
    base: "/media/linaro/cctv",
    manifest: "manifest.m3u8",
    segmentName: "sg_%s_%%t.ts",
    maxAge: 7 * 24 * 60 * 60, /* keep records of one week */
    cleanupPolling: 60, /* every minute */
    segmentSize: 3,
    port: 80,
    targets: {
        OBCHOD: {
            name: "Obchod",
            source: "rtsp://192.168.1.164:554/user=admin&password=&channel=1&stream=0.sdp?real_stream"
        },
        VENKU: {
            name: "Venku",
            source: "rtsp://192.168.1.168:554/user=admin&password=&channel=1&stream=0.sdp?real_stream"
        }
    }
}
