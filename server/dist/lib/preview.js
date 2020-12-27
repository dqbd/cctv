"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getScreenshot = getScreenshot;
var _onvif = require("./onvif");
var _nodeFetch = _interopRequireDefault(require("node-fetch"));
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
const SCREENSHOT_DELAY = 10 * 1000;
const cache = new Map();
function _getScreenshot() {
    _getScreenshot = _asyncToGenerator(function*(onvif, refresh = false) {
        if (!cache.has(onvif)) {
            cache.set(onvif, {
                timeout: 0,
                image: Buffer.from([]),
                url: yield _onvif.getSnapshotUrl(onvif)
            });
        }
        const now = Date.now();
        const cached = cache.get(onvif);
        const { timeout , url  } = cached;
        let { image  } = cached;
        if (timeout + SCREENSHOT_DELAY <= now || refresh) {
            try {
                image = yield _nodeFetch.default(url).then((a)=>a.buffer()
                );
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
function getScreenshot(onvif) {
    return _getScreenshot.apply(this, arguments);
}
