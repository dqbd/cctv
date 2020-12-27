"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getStreamUrl = getStreamUrl;
exports.getSnapshotUrl = getSnapshotUrl;
var _nodeOnvif = require("node-onvif");
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
const initDevice = _asyncToGenerator(function*(xaddr) {
    if (!xaddr) throw Error("Unknown xaddr");
    const device = new _nodeOnvif.OnvifDevice({
        xaddr
    });
    yield device.init();
    return device;
});
function _getStreamUrl() {
    _getStreamUrl = _asyncToGenerator(function*(xaddr) {
        const { stream: { rtsp  } ,  } = (yield initDevice(xaddr)).getCurrentProfile();
        return rtsp;
    });
    return _getStreamUrl.apply(this, arguments);
}
function getStreamUrl(xaddr) {
    return _getStreamUrl.apply(this, arguments);
}
function _getSnapshotUrl() {
    _getSnapshotUrl = _asyncToGenerator(function*(xaddr) {
        const { snapshot  } = (yield initDevice(xaddr)).getCurrentProfile();
        return snapshot;
    });
    return _getSnapshotUrl.apply(this, arguments);
}
function getSnapshotUrl(xaddr) {
    return _getSnapshotUrl.apply(this, arguments);
}
