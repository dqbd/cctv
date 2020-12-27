const net = require("net"),
  crypto = require("crypto")
const types = {
  AUTH: [0x00, 0x00, 0xe8, 0x03],
  SET_TIME: [0x00, 0x00, 0xaa, 0x05],
  SESSION_HEARTBEAT: [0x00, 0x00, 0xee, 0x03],
}

function setSystemTime(credential, ip, port = 34567, time) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket()
    let authenticated = false
    socket.connect(port, ip, () => {
      let authPacket = packetBuilder(
        getLoginPacket(credential.username, credential.password),
        types.AUTH
      )
      socket.write(authPacket)
    })
    socket
      .on("data", async (data) => {
        if (authenticated) return socket.destroy()
        authenticated = true
        let json = JSON.parse(data.slice(20, data.length - 1))
        let timePacket = packetBuilder(
          getTimePacket(json.SessionID, time),
          types.SET_TIME,
          json.SessionID
        )
        socket.write(timePacket)
      })
      .once("error", reject)
      .once("end", resolve)
  })
}

function packetBuilder(obj, messageType, sessionID = 0) {
  let data = Buffer.from(JSON.stringify(obj))

  let header = Buffer.from([0xff, 0x00, 0x00, 0x00]),
    session = Buffer.allocUnsafe(4)
  session.writeInt32LE(sessionID)

  let unknown = Buffer.from([0, 0, 0, 0]),
    messageCode = Buffer.from(messageType)

  let length = Buffer.allocUnsafe(4)
  length.writeInt32LE(data.length + 1)

  let footer = Buffer.from([0x0a])
  return Buffer.concat([
    header,
    session,
    unknown,
    messageCode,
    length,
    data,
    footer,
  ])
}
function getTimePacket(sessionID, customTime) {
  let today = customTime || new Date()
  return {
    Name: "OPTimeSetting",
    OPTimeSetting:
      today.toISOString().split("T")[0] +
      " " +
      today.toTimeString().split(" ")[0],
    SessionID: sessionID,
  }
}
function getLoginPacket(username, password) {
  return {
    EncryptType: "MD5",
    LoginType: "DVRIP-Web",
    PassWord: generatePasswordHash(password),
    UserName: username,
  }
}
/*taken from https://github.com/tothi/pwn-hisilicon-dvr#password-hash-function*/
function generatePasswordHash(password) {
  let result = ""
  let hash = crypto.createHash("md5").update(password).digest()
  for (let i = 0; i < 8; i++) {
    let n = (hash[2 * i] + hash[2 * i + 1]) % 0x3e
    if (n > 9) n += n > 35 ? 61 : 55
    else n += 0x30
    result += String.fromCharCode(n)
  }
  return result
}

module.exports = { setSystemTime: setSystemTime }
