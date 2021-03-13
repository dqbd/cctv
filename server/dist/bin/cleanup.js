"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _path = _interopRequireDefault(require("path"));

var _util = _interopRequireDefault(require("util"));

var _database = require("../lib/database.js");

var readdir = _util.default.promisify(require("fs").readdir);

var rimraf = _util.default.promisify(require("rimraf"));

var config = require("../config.js");

var db = new _database.Database(config.auth.database);

var wait = delay => new Promise(resolve => setTimeout(resolve, delay));

var main = /*#__PURE__*/function () {
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

  return function main() {
    return _ref.apply(this, arguments);
  };
}();

main();