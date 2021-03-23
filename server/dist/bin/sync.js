"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _path = _interopRequireDefault(require("path"));

var _util = _interopRequireDefault(require("util"));

var _chokidar = _interopRequireDefault(require("chokidar"));

var _fs = _interopRequireDefault(require("fs"));

var _database = require("../lib/database");

var _config = require("../lib/config");

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

var main = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2.default)(function* () {
    var manifests = Object.keys(config.targets).map(cameraKey => {
      return _path.default.resolve(config.base, cameraKey, config.manifest);
    });

    var filesOfManifest = manifest => manifest.split("\n").filter(line => line.indexOf(".ts") >= 0);

    var rdiff = (left, right) => right.filter(val => !left.includes(val));

    var manifestCache = {};

    var handleChange = /*#__PURE__*/function () {
      var _ref2 = (0, _asyncToGenerator2.default)(function* (targetFile) {
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
        return _ref2.apply(this, arguments);
      };
    }();

    _chokidar.default.watch(manifests).on("add", handleChange).on("change", handleChange);
  });

  return function main() {
    return _ref.apply(this, arguments);
  };
}();

main();