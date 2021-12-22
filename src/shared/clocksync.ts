import net from "net"
import crypto from "crypto"

const types = {
  AUTH: [0x00, 0x00, 0xe8, 0x03],
  SET_TIME: [0x00, 0x00, 0xaa, 0x05],
  SESSION_HEARTBEAT: [0x00, 0x00, 0xee, 0x03],
}

// taken from https://github.com/tothi/pwn-hisilicon-dvr#password-hash-function
function generatePasswordHash(password: string) {
  let result = ""
  const hash = crypto.createHash("md5").update(password).digest()
  for (let i = 0; i < 8; i++) {
    let n = (hash[2 * i] + hash[2 * i + 1]) % 0x3e
    if (n > 9) n += n > 35 ? 61 : 55
    else n += 0x30
    result += String.fromCharCode(n)
  }
  return result
}

function getTimePacket(sessionID: string | number, customTime?: Date) {
  const today = customTime || new Date()
  return {
    Name: "OPTimeSetting",
    OPTimeSetting:
      today.toISOString().split("T")[0] +
      " " +
      today.toTimeString().split(" ")[0],
    SessionID: sessionID,
  }
}

function getLoginPacket(username: string, password: string) {
  return {
    EncryptType: "MD5",
    LoginType: "DVRIP-Web",
    PassWord: generatePasswordHash(password),
    UserName: username,
  }
}

function packetBuilder<T>(obj: T, messageType: number[], sessionID = 0) {
  const data = Buffer.from(JSON.stringify(obj))

  const header = Buffer.from([0xff, 0x00, 0x00, 0x00]),
    session = Buffer.allocUnsafe(4)
  session.writeInt32LE(sessionID)

  const unknown = Buffer.from([0, 0, 0, 0]),
    messageCode = Buffer.from(messageType)

  const length = Buffer.allocUnsafe(4)
  length.writeInt32LE(data.length + 1)

  const footer = Buffer.from([0x0a])
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

enum SystemTimeState {
  DISCONNECT,
  CONNECTED,
  AUTHENTICATED,
  UPDATED,
}

export function setSystemTime(
  credential: { username: string; password: string },
  ip: string,
  port = 34567,
  time?: Date
) {
  return new Promise<void>((resolve, reject) => {
    const socket = new net.Socket()

    let state = SystemTimeState.DISCONNECT
    let lastError: unknown

    socket
      .on("data", async (data) => {
        const payload = JSON.parse(data.slice(20, data.length - 1).toString())
        const sessionId = payload.SessionID

        try {
          switch (state) {
            case SystemTimeState.CONNECTED: {
              state = SystemTimeState.AUTHENTICATED

              if (payload.Ret !== 100) {
                throw new Error(`Failed to authenticate ${payload.Ret}`)
              }

              socket.write(
                packetBuilder(
                  getTimePacket(sessionId, time),
                  types.SET_TIME,
                  sessionId
                )
              )
              break
            }
            case SystemTimeState.AUTHENTICATED: {
              state = SystemTimeState.UPDATED
              if (payload.Ret !== 100) {
                throw new Error(`Failed to set time ${payload.Ret}`)
              }

              socket.destroy()
              break
            }
            default:
              break
          }
        } catch (err) {
          lastError = err
          socket.destroy()
        }
      })
      .once("error", (err) => (lastError = err))
      .once("close", (hadError) => {
        if (hadError || lastError) {
          return reject(lastError)
        }
        resolve()
      })
      .connect(port, ip, () => {
        state = SystemTimeState.CONNECTED
        socket.write(
          packetBuilder(
            getLoginPacket(credential.username, credential.password),
            types.AUTH
          )
        )
      })
  })
}
