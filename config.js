module.exports = {
    base: "/media/linaro/cctv",
    manifest: "manifest.m3u8",
    segmentName: "sg_%s_%%t.ts",
    maxAge: 7 * 24 * 60 * 60, /* keep records of one week */
    cleanupPolling: 60, /* every minute */
    segmentSize: 3,
    port: 80,
    targets: {
        VZADU_PROSTERADLA: {
            name: "Vzadu prosteradla",
            source: "rtsp://192.168.2.164:554/user=admin&password=&channel=1&stream=0.sdp?real_stream"
        },
        VENKU: {
            name: "Venku",
            source: "rtsp://192.168.2.168:554/user=admin&password=&channel=1&stream=0.sdp?real_stream"
        },
	STARY_VCHOD: {
            name: "Stary vchod",
            source: "rtsp://192.168.2.172:554/user=admin&password=&channel=1&stream=0.sdp?real_stream"
	},
	STARY_SPODNI: {
            name: "Stary spodni",
            source: "rtsp://192.168.2.176:554/user=admin&password=&channel=1&stream=0.sdp?real_stream"
	},
	VPREDU_VCHOD: {
            name: "Vpredu vchod",
            source: "rtsp://192.168.2.180:554/user=admin&password=&channel=1&stream=0.sdp?real_stream"
	},
	VZADU_KOSILE: {
	    name: "Vzadu kosile",
            source: "rtsp://192.168.2.184:554/user=admin&password=&channel=1&stream=0.sdp?real_stream"
	}
    }
}
