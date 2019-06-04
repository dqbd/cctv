const auth = require('./auth.json')

module.exports = {
    base: "/media/linaro/cctv",
    ipcBase: "/tmp/hackycctv",
    manifest: "manifest.m3u8",
    segmentName: "%Y_%m_%d_%H/sg_%s_%%t.ts",
    maxAge: 3 * 24 * 60 * 60, /* emergency mode, only a day, reduce if still issucifient*/
    cleanupPolling: 60, /* every minute */
    segmentSize: 3,
    port: 80,
    wanPort: 8080,
    targets: {
        VENKU: {
            name: "Venku",
            source: "rtsp://192.168.2.168:554/user=admin&password=&channel=1&stream=0.sdp?real_stream",
            preview: "rtsp://192.168.2.168:554/user=admin&password=&channel=1&stream=1.sdp?real_stream",
            screenshot: "http://192.168.2.168/webcapture.jpg?command=snap&channel=1",
            port: 9168,
        },
        STARY_VCHOD: {
            name: "Starý - vchod",
            source: "rtsp://192.168.2.172:554/user=admin&password=&channel=1&stream=0.sdp?real_stream",
            preview: "rtsp://192.168.2.172:554/user=admin&password=&channel=1&stream=1.sdp?real_stream",
            screenshot: "http://192.168.2.172/webcapture.jpg?command=snap&channel=1",
            port: 9172,
        },
        STARY_SPODNI: {
            name: "Starý - spodní prádlo",
            source: "rtsp://192.168.2.176:554/user=admin&password=&channel=1&stream=0.sdp?real_stream",
            preview: "rtsp://192.168.2.176:554/user=admin&password=&channel=1&stream=1.sdp?real_stream",
            screenshot: "http://192.168.2.176/webcapture.jpg?command=snap&channel=1",
            port: 9176,
        },
        VPREDU_VCHOD: {
            name: "Vpředu - vchod",
            source: "rtsp://192.168.2.180:554/user=admin&password=&channel=1&stream=0.sdp?real_stream",
            preview: "rtsp://192.168.2.180:554/user=admin&password=&channel=1&stream=1.sdp?real_stream",
            screenshot: "http://192.168.2.180/webcapture.jpg?command=snap&channel=1",
            port: 9180,
        },
        VZADU_KOSILE: {
            name: "Vzadu - košile",
            source: "rtsp://192.168.2.184:554/user=admin&password=&channel=1&stream=0.sdp?real_stream",
            preview: "rtsp://192.168.2.184:554/user=admin&password=&channel=1&stream=1.sdp?real_stream",
            screenshot: "http://192.168.2.184/webcapture.jpg?command=snap&channel=1",
            port: 9184,
        },
        VZADU_PROSTERADLA: {
            name: "Vzadu - prostěradlo",
            source: "rtsp://192.168.2.164:554/user=admin&password=&channel=1&stream=0.sdp?real_stream",
            preview: "rtsp://192.168.2.164:554/user=admin&password=&channel=1&stream=1.sdp?real_stream",
            screenshot: "http://192.168.2.164/webcapture.jpg?command=snap&channel=1",
            port: 9164,
        }
    },
    syncInterval: 60 * 60, /* sync time every day */
    auth,
    credential: {
        username: 'admin',
        password: ''
    },
    mediasoup: {
        mediaCodecs: [
            {
                kind: 'video',
                mimeType: 'video/h264',
                clockRate: 90000,
                parameters: {
                    'packetization-mode': 0,
                    'profile-level-id': '4d0032',
                    'level-asymmetry-allowed': 1,
                    'x-google-start-bitrate': 1000
                }
            },
            {
                kind: 'video',
                mimeType: 'video/h264',
                clockRate: 90000,
                parameters: {
                    'packetization-mode': 0,
                    'profile-level-id': '42e01f',
                    'level-asymmetry-allowed': 1,
                    'x-google-start-bitrate': 1000
                }
            }
        ],
        webRtcTransport: {
            listenIps: [
                { ip: '127.0.0.1' }
            ],
            maxIncomingBitrate: 1500000,
            initialAvailableOutgoingBitrate: 1000000
        }
    }
}