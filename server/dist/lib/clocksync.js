"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setSystemTime = setSystemTime;

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _net = _interopRequireDefault(require("net"));

var _crypto = _interopRequireDefault(require("crypto"));

var types = {
  AUTH: [0x00, 0x00, 0xe8, 0x03],
  SET_TIME: [0x00, 0x00, 0xaa, 0x05],
  SESSION_HEARTBEAT: [0x00, 0x00, 0xee, 0x03]
};

function setSystemTime(credential, ip) {
  var port = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 34567;
  var time = arguments.length > 3 ? arguments[3] : undefined;
  return new Promise((resolve, reject) => {
    var socket = new _net.default.Socket();
    var authenticated = false;
    socket.connect(port, ip, () => {
      var authPacket = packetBuilder(getLoginPacket(credential.username, credential.password), types.AUTH);
      socket.write(authPacket);
    });
    socket.on("data", /*#__PURE__*/function () {
      var _ref = (0, _asyncToGenerator2.default)(function* (data) {
        if (authenticated) return socket.destroy();
        authenticated = true;
        var json = JSON.parse(data.slice(20, data.length - 1).toString());
        var timePacket = packetBuilder(getTimePacket(json.SessionID, time), types.SET_TIME, json.SessionID);
        socket.write(timePacket);
      });

      return function (_x) {
        return _ref.apply(this, arguments);
      };
    }()).once("error", reject).once("end", resolve);
  });
}

function packetBuilder(obj, messageType) {
  var sessionID = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
  var data = Buffer.from(JSON.stringify(obj));
  var header = Buffer.from([0xff, 0x00, 0x00, 0x00]),
      session = Buffer.allocUnsafe(4);
  session.writeInt32LE(sessionID);
  var unknown = Buffer.from([0, 0, 0, 0]),
      messageCode = Buffer.from(messageType);
  var length = Buffer.allocUnsafe(4);
  length.writeInt32LE(data.length + 1);
  var footer = Buffer.from([0x0a]);
  return Buffer.concat([header, session, unknown, messageCode, length, data, footer]);
}

function getTimePacket(sessionID, customTime) {
  var today = customTime || new Date();
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
/*taken from https://github.com/tothi/pwn-hisilicon-dvr#password-hash-function*/


function generatePasswordHash(password) {
  var result = "";

  var hash = _crypto.default.createHash("md5").update(password).digest();

  for (var i = 0; i < 8; i++) {
    var n = (hash[2 * i] + hash[2 * i + 1]) % 0x3e;
    if (n > 9) n += n > 35 ? 61 : 55;else n += 0x30;
    result += String.fromCharCode(n);
  }

  return result;
}