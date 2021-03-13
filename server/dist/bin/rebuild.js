"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _util = _interopRequireDefault(require("util"));

var _mkdirp = _interopRequireDefault(require("mkdirp"));

var _database = require("../lib/database");

var _config = require("../lib/config");

var readdir = _util.default.promisify(_fs.default.readdir);

var config = (0, _config.getConfig)();
var db = new _database.Database(config.auth.database);

var main = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2.default)(function* () {
    for (var cameraKey in config.targets) {
      console.log("Rebuilding", cameraKey);

      var folderTarget = _path.default.resolve(config.base, cameraKey);

      _mkdirp.default.sync(folderTarget);

      console.log("Reset folder", cameraKey);
      yield db.resetFolder(cameraKey);
      console.log("Get folder list", cameraKey);
      var toInsert = (yield readdir(folderTarget)).filter(folder => folder.indexOf("_") >= 0);

      var _loop = function* _loop(target) {
        console.log("Insert folder", cameraKey);
        var files = (yield readdir(_path.default.resolve(folderTarget, target))).map(file => _path.default.join(target, file));
        yield db.insertFolder(cameraKey, target, files);
      };

      for (var target of toInsert) {
        yield* _loop(target);
      }
    }

    db.close();
  });

  return function main() {
    return _ref.apply(this, arguments);
  };
}();

main();