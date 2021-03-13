"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getScreenshot = getScreenshot;

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _onvif = require("./onvif");

var _nodeFetch = _interopRequireDefault(require("node-fetch"));

var SCREENSHOT_DELAY = 10 * 1000;
var cache = new Map();

function getScreenshot(_x) {
  return _getScreenshot.apply(this, arguments);
}

function _getScreenshot() {
  _getScreenshot = (0, _asyncToGenerator2.default)(function* (onvif) {
    var refresh = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    if (!cache.has(onvif)) {
      cache.set(onvif, {
        timeout: 0,
        image: Buffer.from([]),
        url: yield (0, _onvif.getSnapshotUrl)(onvif)
      });
    }

    var now = Date.now();
    var cached = cache.get(onvif);
    var {
      timeout,
      url
    } = cached;
    var {
      image
    } = cached;

    if (timeout + SCREENSHOT_DELAY <= now || refresh) {
      try {
        image = yield (0, _nodeFetch.default)(url).then(a => a.buffer());
        cache.set(onvif, {
          timeout: now,
          image,
          url
        });
      } catch (err) {
        console.log(err);
      }
    }

    return image;
  });
  return _getScreenshot.apply(this, arguments);
}