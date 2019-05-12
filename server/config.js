const auth = require('./auth.json')

module.exports = {
    base: "/media/linaro/cctv",
    ipcBase: "/tmp",
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
            port: 9168,
        },
        STARY_VCHOD: {
            name: "Starý - vchod",
            source: "rtsp://192.168.2.172:554/user=admin&password=&channel=1&stream=0.sdp?real_stream",
            preview: "rtsp://192.168.2.172:554/user=admin&password=&channel=1&stream=1.sdp?real_stream",
            port: 9172,
        },
        STARY_SPODNI: {
            name: "Starý - spodní prádlo",
            source: "rtsp://192.168.2.176:554/user=admin&password=&channel=1&stream=0.sdp?real_stream",
            preview: "rtsp://192.168.2.176:554/user=admin&password=&channel=1&stream=1.sdp?real_stream",
            port: 9176,
        },
        VPREDU_VCHOD: {
            name: "Vpředu - vchod",
            source: "rtsp://192.168.2.180:554/user=admin&password=&channel=1&stream=0.sdp?real_stream",
            preview: "rtsp://192.168.2.180:554/user=admin&password=&channel=1&stream=1.sdp?real_stream",
            port: 9180,
        },
        VZADU_KOSILE: {
            name: "Vzadu - košile",
            source: "rtsp://192.168.2.184:554/user=admin&password=&channel=1&stream=0.sdp?real_stream",
            preview: "rtsp://192.168.2.184:554/user=admin&password=&channel=1&stream=1.sdp?real_stream",
            port: 9184,
        },
        VZADU_PROSTERADLA: {
            name: "Vzadu - prostěradlo",
            source: "rtsp://192.168.2.164:554/user=admin&password=&channel=1&stream=0.sdp?real_stream",
            preview: "rtsp://192.168.2.164:554/user=admin&password=&channel=1&stream=1.sdp?real_stream",
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
        // Listening hostname (just for for `gulp live|open` tasks).
        domain: 'localhost',
        // Signaling settings.
        https: {
            listenIp: '0.0.0.0',
            listenPort: 4443, // NOTE: Don't change it (client app assumes 4443).
            tls: {
                cert: `${__dirname}/certs/mediasoup-demo.localhost.cert.pem`,
                key: `${__dirname}/certs/mediasoup-demo.localhost.key.pem`
            }
        },
        // Media settings.
        mediasoup: {
            // mediasoup Worker settings.
            worker: {
                logLevel: 'warn',
                logTags: [
                    'info',
                    'ice',
                    'dtls',
                    'rtp',
                    'srtp',
                    'rtcp',
                    // 'rtx',
                    // 'bwe',
                    // 'score',
                    // 'simulcast',
                    // 'svc'
                ],
                rtcMinPort: 40000,
                rtcMaxPort: 49999
            },
            // mediasoup Router settings.
            router: {
                // Router media codecs.
                mediaCodecs: [{
                        kind: 'audio',
                        mimeType: 'audio/opus',
                        clockRate: 48000,
                        channels: 2
                    },
                    {
                        kind: 'video',
                        mimeType: 'video/VP8',
                        clockRate: 90000,
                        parameters: {
                            'x-google-start-bitrate': 1000
                        }
                    },
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
                ]
            },
            // mediasoup WebRtcTransport settings.
            webRtcTransport: {
                listenIps: [{
                    ip: '0.0.0.0',
                    announcedIp: '192.168.1.123'
                }],
                maxIncomingBitrate: 1500000,
                initialAvailableOutgoingBitrate: 1000000
            }
        }
    }
}