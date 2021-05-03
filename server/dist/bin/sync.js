"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _path = _interopRequireDefault(require("path"));

var _util = _interopRequireDefault(require("util"));

var _chokidar = _interopRequireDefault(require("chokidar"));

var _fs = _interopRequireDefault(require("fs"));

var _database = require("../lib/database");

var _config = require("../lib/config");

var readdir = _util.default.promisify(require("fs").readdir);

var rimraf = _util.default.promisify(require("rimraf"));

var readFile = _util.default.promisify(_fs.default.readFile);

var config = (0, _config.getConfig)();
var db = new _database.Database();

var wait = delay => new Promise(resolve => setTimeout(resolve, delay));

function readNonEmptyFile(_x) {
  return _readNonEmptyFile.apply(this, arguments);
}

function _readNonEmptyFile() {
  _readNonEmptyFile = (0, _asyncToGenerator2.default)(function* (target) {
    var content = "";
    var attempts = 0;
    var delay = 100;
    var maxAttempts = config.segmentSize * 1000 / delay;

    while (!content && attempts < maxAttempts) {
      content = yield readFile(target, "utf-8");
      if (!content) yield wait(delay);
    }

    return content;
  });
  return _readNonEmptyFile.apply(this, arguments);
}

var cleanup_main = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2.default)(function* () {
    var cleanup = /*#__PURE__*/function () {
      var _ref2 = (0, _asyncToGenerator2.default)(function* () {
        var _loop = function* _loop(cameraKey) {
          console.log("Cleanup", cameraKey);

          var baseFolder = _path.default.resolve(config.base, cameraKey);

          var now = new Date();
          var nowTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0).valueOf();

          try {
            var folders = (yield readdir(baseFolder)).filter(folderName => {
              var [year, month, day, hour] = folderName.split("_").map(num => Number.parseInt(num, 10));
              var folderTime = new Date(year, month - 1, day, hour, 0, 0, 0).valueOf();
              var cleanupTime = folderTime + config.maxAge * 1000;
              return cleanupTime <= nowTime;
            });
            yield folders.reduce((memo, folder) => {
              return memo.then(() => {
                var target = _path.default.resolve(baseFolder, folder);

                return rimraf(target);
              });
            }, Promise.resolve());
            console.log("Deleted folders", folders && folders.join(", "));
            yield db.removeOldScenesAndMotion(cameraKey, config.maxAge);
            console.log("Deleted from DB", cameraKey);
          } catch (err) {
            if (err.code !== "ENOENT") throw err;
          }
        };

        for (var cameraKey of Object.keys(config.targets)) {
          yield* _loop(cameraKey);
        }
      });

      return function cleanup() {
        return _ref2.apply(this, arguments);
      };
    }();

    var loop = /*#__PURE__*/function () {
      var _ref3 = (0, _asyncToGenerator2.default)(function* () {
        yield cleanup();
        console.log("Cleanup finished for now");
        yield wait(config.cleanupPolling * 1000);
        loop();
      });

      return function loop() {
        return _ref3.apply(this, arguments);
      };
    }();

    loop();
  });

  return function cleanup_main() {
    return _ref.apply(this, arguments);
  };
}();

var sync_main = /*#__PURE__*/function () {
  var _ref4 = (0, _asyncToGenerator2.default)(function* () {
    var manifests = Object.keys(config.targets).map(cameraKey => {
      return _path.default.resolve(config.base, cameraKey, config.manifest);
    });

    var filesOfManifest = manifest => manifest.split("\n").filter(line => line.indexOf(".ts") >= 0);

    var rdiff = (left, right) => right.filter(val => !left.includes(val));

    var manifestCache = {};

    var handleChange = /*#__PURE__*/function () {
      var _ref5 = (0, _asyncToGenerator2.default)(function* (targetFile) {
        var cameraKey = _path.default.relative(config.base, targetFile).split(_path.default.sep).shift();

        if (!cameraKey) return;
        var file = yield readNonEmptyFile(targetFile);
        var manifest = filesOfManifest(file);

        var baseFolder = _path.default.resolve(config.base, cameraKey);

        if (manifestCache[cameraKey]) {
          var toInsert = rdiff(manifestCache[cameraKey], manifest);

          for (var item of toInsert) {
            var relative = _path.default.relative(baseFolder, item);

            yield db.insert(cameraKey, relative);
          }
        }

        if (manifest && manifest.length > 0) manifestCache[cameraKey] = manifest;
      });

      return function handleChange(_x2) {
        return _ref5.apply(this, arguments);
      };
    }();

    _chokidar.default.watch(manifests).on("add", handleChange).on("change", handleChange);
  });

  return function sync_main() {
    return _ref4.apply(this, arguments);
  };
}();

var main = /*#__PURE__*/function () {
  var _ref6 = (0, _asyncToGenerator2.default)(function* () {
    cleanup_main();
    sync_main();
  });

  return function main() {
    return _ref6.apply(this, arguments);
  };
}();

main(); // cleanup