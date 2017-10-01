module.exports = {
  apps : [
    {
      name: "OBCHOD",
      script: "./parse.sh",
      args: "OBCHOD rtsp://192.168.1.164:554/user=admin&password=&channel=1&stream=0.sdp?real_stream",
    },
    {
      name: "VENKU",
      script: "./parse.sh",
      args: "VENKU rtsp://192.168.1.168:554/user=admin&password=&channel=1&stream=0.sdp?real_stream",
    },
    {
      name: 'display',
      script: './sigsegv.js',
      args: '"bash ./display.sh"',
    },
    {
      name: 'broadcast',
      script: './index.js',
    }
  ]
}
