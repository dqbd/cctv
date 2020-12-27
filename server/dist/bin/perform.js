"use strict";
var _config = require("../lib/config");
var _url = _interopRequireDefault(require("url"));
var _path = _interopRequireDefault(require("path"));
var _mkdirp = _interopRequireDefault(require("mkdirp"));
var _fluentFfmpeg = _interopRequireDefault(require("fluent-ffmpeg"));
var _clocksync = require("../lib/clocksync");
var _onvif = require("../lib/onvif");
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
const config = _config.getConfig();
const cameraKey = process.argv.slice().pop();
if (!cameraKey) throw Error("Invalid camera key");
const target = config.targets[cameraKey];
if (!target) throw Error("Invalid argument");
const credential = config.auth.onvif;
const baseFolder = _path.default.resolve(config.base, cameraKey);
_mkdirp.default.sync(baseFolder);
const start = _asyncToGenerator(function*() {
    const address = yield _onvif.getStreamUrl(target.onvif);
    const hostname = _url.default.parse(address).hostname;
    const main = _fluentFfmpeg.default().addInput(address).inputOptions([
        "-stimeout 30000000"
    ]).addOutput(_path.default.resolve(baseFolder, config.manifest)).audioCodec("copy").videoCodec("copy").outputOptions([
        `-hls_time ${config.segmentSize}`,
        `-use_localtime_mkdir 1`,
        `-hls_start_number_source epoch`,
        `-use_localtime 1`,
        `-hls_flags second_level_segment_duration`,
        `-hls_segment_filename ${_path.default.resolve(baseFolder, config.segmentName)}`, 
    ]).on("start", function(cmd) {
        return console.log("Command", cmd);
    }).on("codecData", function(data) {
        return console.log("Codec data", data);
    }).on("progress", function(progress) {
        return console.log("Processing", progress.frames, progress.timemark);
    }).on("stderr", console.log).on("end", function() {
        console.log("main stream end");
        process.exit();
    }).on("error", function(err, stdout, stderr) {
        console.log("An error occurred", err.message, stdout, stderr);
        process.exit();
    });
    main.run();
    let timeSyncTimer;
    if (hostname) {
        const timeSync = _asyncToGenerator(function*() {
            clearTimeout(timeSyncTimer);
            console.time(`timeSync ${cameraKey}`);
            try {
                yield _clocksync.setSystemTime(credential, hostname);
            } catch (err) {
                console.error(`failed to set ${cameraKey} time:`, err);
            }
            console.timeEnd(`timeSync ${cameraKey}`);
            timeSyncTimer = setTimeout(timeSync, 60 * 1000);
        });
        timeSync();
    }
    process.on("exit", function() {
        console.log("Closing", cameraKey);
        clearTimeout(timeSyncTimer);
        try {
            if (main) main.kill("SIGKILL");
        } catch (err) {
            console.log(err);
        }
    });
});
try {
    start();
} catch (err) {
    console.log(err);
}
