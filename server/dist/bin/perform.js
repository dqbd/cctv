"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _config = require("../lib/config");

var _url = _interopRequireDefault(require("url"));

var _path = _interopRequireDefault(require("path"));

var _mkdirp = _interopRequireDefault(require("mkdirp"));

var _fluentFfmpeg = _interopRequireDefault(require("fluent-ffmpeg"));

var _clocksync = require("../lib/clocksync");

var _onvif = require("../lib/onvif");

var config = (0, _config.getConfig)();
var cameraKey = process.argv.slice().pop();
if (!cameraKey) throw Error("Invalid camera key");
var target = config.targets[cameraKey];
if (!target) throw Error("Invalid argument");
var credential = config.auth.onvif;

var baseFolder = _path.default.resolve(config.base, cameraKey);

_mkdirp.default.sync(baseFolder);

var start = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2.default)(function* () {
    var address = yield (0, _onvif.getStreamUrl)(target.onvif);

    var hostname = _url.default.parse(address).hostname;

    var main = (0, _fluentFfmpeg.default)().addInput(address).inputOptions(["-stimeout 30000000"]).addOutput(_path.default.resolve(baseFolder, config.manifest)).audioCodec("copy").videoCodec("copy").outputOptions(["-hls_time ".concat(config.segmentSize), "-use_localtime_mkdir 1", "-hls_start_number_source epoch", "-use_localtime 1", "-hls_flags second_level_segment_duration", "-hls_segment_filename ".concat(_path.default.resolve(baseFolder, config.segmentName))]).on("start", cmd => console.log("Command", cmd)).on("codecData", data => console.log("Codec data", data)).on("progress", progress => console.log("Processing", progress.frames, progress.timemark)).on("stderr", console.log).on("end", () => {
      console.log("main stream end");
      process.exit();
    }).on("error", (err, stdout, stderr) => {
      console.log("An error occurred", err.message, stdout, stderr);
      process.exit();
    });
    main.run();
    var timeSyncTimer;

    if (hostname) {
      var timeSync = /*#__PURE__*/function () {
        var _ref2 = (0, _asyncToGenerator2.default)(function* () {
          clearTimeout(timeSyncTimer);
          console.time("timeSync ".concat(cameraKey));

          try {
            yield (0, _clocksync.setSystemTime)(credential, hostname);
          } catch (err) {
            console.error("failed to set ".concat(cameraKey, " time:"), err);
          }

          console.timeEnd("timeSync ".concat(cameraKey));
          timeSyncTimer = setTimeout(timeSync, 60 * 1000);
        });

        return function timeSync() {
          return _ref2.apply(this, arguments);
        };
      }();

      timeSync();
    }

    process.on("exit", () => {
      console.log("Closing", cameraKey);
      clearTimeout(timeSyncTimer);

      try {
        if (main) main.kill("SIGKILL");
      } catch (err) {
        console.log(err);
      }
    });
  });

  return function start() {
    return _ref.apply(this, arguments);
  };
}();

try {
  start();
} catch (err) {
  console.log(err);
}