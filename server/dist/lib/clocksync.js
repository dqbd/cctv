"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.setSystemTime = setSystemTime;
var _net = _interopRequireDefault(require("net"));
var _crypto = _interopRequireDefault(require("crypto"));
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
        var info = gen[key](arg);
        var value = info.value;
    } catch (error) {
        reject(error);
        return;
    }
    if (info.done) {
        resolve(value);
    } else {
        Promise.resolve(value).then(_next, _throw);
    }
}
function _asyncToGenerator(fn) {
    return function() {
        var self = this, args = arguments;
        return new Promise(function(resolve, reject) {
            var gen = fn.apply(self, args);
            function _next(value) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
            }
            function _throw(err) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
            }
            _next(undefined);
        });
    };
}
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const types = {
    AUTH: [
        0,
        0,
        232,
        3
    ],
    SET_TIME: [
        0,
        0,
        170,
        5
    ],
    SESSION_HEARTBEAT: [
        0,
        0,
        238,
        3
    ]
};
function setSystemTime(credential, ip, port = 34567, time) {
    return new Promise((resolve, reject)=>{
        const socket = new _net.default.Socket();
        let authenticated = false;
        socket.connect(port, ip, ()=>{
            let authPacket = packetBuilder(getLoginPacket(credential.username, credential.password), types.AUTH);
            socket.write(authPacket);
        });
        socket.on("data", _asyncToGenerator(function*(data) {
            if (authenticated) return socket.destroy();
            authenticated = true;
            let json = JSON.parse(data.slice(20, data.length - 1).toString());
            let timePacket = packetBuilder(getTimePacket(json.SessionID, time), types.SET_TIME, json.SessionID);
            socket.write(timePacket);
        })).once("error", reject).once("end", resolve);
    });
}
function packetBuilder(obj, messageType, sessionID = 0) {
    let data = Buffer.from(JSON.stringify(obj));
    let header = Buffer.from([
        255,
        0,
        0,
        0
    ]), session = Buffer.allocUnsafe(4);
    session.writeInt32LE(sessionID);
    let unknown = Buffer.from([
        0,
        0,
        0,
        0
    ]), messageCode = Buffer.from(messageType);
    let length = Buffer.allocUnsafe(4);
    length.writeInt32LE(data.length + 1);
    let footer = Buffer.from([
        10
    ]);
    return Buffer.concat([
        header,
        session,
        unknown,
        messageCode,
        length,
        data,
        footer, 
    ]);
}
function getTimePacket(sessionID, customTime) {
    let today = customTime || new Date();
    return {
        Name: "OPTimeSetting",
        OPTimeSetting: today.toISOString().split("T")[0] + " " + today.toTimeString().split(" ")[0],
        SessionID: sessionID
    };
}
function getLoginPacket(username, password) {
    return {
        EncryptType: "MD5",
        LoginType: "DVRIP-Web",
        PassWord: generatePasswordHash(password),
        UserName: username
    };
}
/*taken from https://github.com/tothi/pwn-hisilicon-dvr#password-hash-function*/ function generatePasswordHash(password) {
    let result = "";
    let hash = _crypto.default.createHash("md5").update(password).digest();
    for(let i = 0; i < 8; i++){
        let n = (hash[2 * i] + hash[2 * i + 1]) % 62;
        if (n > 9) n += n > 35 ? 61 : 55;
        else n += 48;
        result += String.fromCharCode(n);
    }
    return result;
}
