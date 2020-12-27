"use strict";
var _path = _interopRequireDefault(require("path"));
var _util = _interopRequireDefault(require("util"));
var _chokidar = _interopRequireDefault(require("chokidar"));
var _fs = _interopRequireDefault(require("fs"));
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
const readFile = _util.default.promisify(_fs.default.readFile);
const config = _config.getConfig();
const db = new _database.Database(config.auth.database);
const wait = (delay)=>new Promise((resolve)=>setTimeout(resolve, delay)
    )
;
function _readNonEmptyFile() {
    _readNonEmptyFile = _asyncToGenerator(function*(target) {
        let content = "";
        let attempts = 0;
        const delay = 100;
        const maxAttempts = config.segmentSize * 1000 / delay;
        while(!content && attempts < maxAttempts){
            content = yield readFile(target, "utf-8");
            if (!content) yield wait(delay);
        }
        return content;
    });
    return _readNonEmptyFile.apply(this, arguments);
}
function readNonEmptyFile(target) {
    return _readNonEmptyFile.apply(this, arguments);
}
const main = _asyncToGenerator(function*() {
    const manifests = Object.keys(config.targets).map(function(cameraKey) {
        return _path.default.resolve(config.base, cameraKey, config.manifest);
    });
    const filesOfManifest = function(manifest) {
        return manifest.split("\n").filter(function(line) {
            return line.indexOf(".ts") >= 0;
        });
    };
    const rdiff = function(left, right) {
        return right.filter(function(val) {
            return !left.includes(val);
        });
    };
    const manifestCache = {
    };
    const handleChange = _asyncToGenerator(function*(targetFile) {
        const cameraKey = _path.default.relative(config.base, targetFile).split(_path.default.sep).shift();
        if (!cameraKey) return;
        const file = yield readNonEmptyFile(targetFile);
        const manifest = filesOfManifest(file);
        const baseFolder = _path.default.resolve(config.base, cameraKey);
        if (manifestCache[cameraKey]) {
            const toInsert = rdiff(manifestCache[cameraKey], manifest);
            for (let item of toInsert){
                const relative = _path.default.relative(baseFolder, item);
                yield db.insert(cameraKey, relative);
            }
        }
        if (manifest && manifest.length > 0) manifestCache[cameraKey] = manifest;
    });
    _chokidar.default.watch(manifests).on("add", handleChange).on("change", handleChange);
});
main();
