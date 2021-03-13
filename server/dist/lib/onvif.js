"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getStreamUrl = getStreamUrl;
exports.getSnapshotUrl = getSnapshotUrl;

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _nodeOnvif = require("node-onvif");

var initDevice = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2.default)(function* (xaddr) {
    if (!xaddr) throw Error("Unknown xaddr");
    var device = new _nodeOnvif.OnvifDevice({
      xaddr
    });
    yield device.init();
    return device;
  });

  return function initDevice(_x) {
    return _ref.apply(this, arguments);
  };
}();

function getStreamUrl(_x2) {
  return _getStreamUrl.apply(this, arguments);
}

function _getStreamUrl() {
  _getStreamUrl = (0, _asyncToGenerator2.default)(function* (xaddr) {
    var {
      stream: {
        rtsp
      }
    } = (yield initDevice(xaddr)).getCurrentProfile();
    return rtsp;
  });
  return _getStreamUrl.apply(this, arguments);
}

function getSnapshotUrl(_x3) {
  return _getSnapshotUrl.apply(this, arguments);
}

function _getSnapshotUrl() {
  _getSnapshotUrl = (0, _asyncToGenerator2.default)(function* (xaddr) {
    var {
      snapshot
    } = (yield initDevice(xaddr)).getCurrentProfile();
    return snapshot;
  });
  return _getSnapshotUrl.apply(this, arguments);
}