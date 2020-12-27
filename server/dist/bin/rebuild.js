"use strict";
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _util = _interopRequireDefault(require("util"));
var _mkdirp = _interopRequireDefault(require("mkdirp"));
var _database = require("../lib/database");
var _config = require("../lib/config");
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
const readdir = _util.default.promisify(_fs.default.readdir);
const config = _config.getConfig();
const db = new _database.Database(config.auth.database);
const main = _asyncToGenerator(function*() {
    for(const cameraKey in config.targets){
        console.log("Rebuilding", cameraKey);
        const folderTarget = _path.default.resolve(config.base, cameraKey);
        _mkdirp.default.sync(folderTarget);
        console.log("Reset folder", cameraKey);
        yield db.resetFolder(cameraKey);
        console.log("Get folder list", cameraKey);
        const toInsert = (yield readdir(folderTarget)).filter(function(folder) {
            return folder.indexOf("_") >= 0;
        });
        for (const target of toInsert){
            console.log("Insert folder", cameraKey);
            const files = (yield readdir(_path.default.resolve(folderTarget, target))).map(function(file) {
                return _path.default.join(target, file);
            });
            yield db.insertFolder(cameraKey, target, files);
        }
    }
    db.close();
});
main();
