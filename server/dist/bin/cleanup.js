"use strict";
var _path = _interopRequireDefault(require("path"));
var _util = _interopRequireDefault(require("util"));
var _databaseJs = require("../lib/database.js");
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
const readdir = _util.default.promisify(require("fs").readdir);
const rimraf = _util.default.promisify(require("rimraf"));
const config = require("../config.js");
const db = new _databaseJs.Database(config.auth.database);
const wait = (delay)=>new Promise((resolve)=>setTimeout(resolve, delay)
    )
;
const main = _asyncToGenerator(function*() {
    const cleanup = _asyncToGenerator(function*() {
        for (const cameraKey of Object.keys(config.targets)){
            console.log("Cleanup", cameraKey);
            const baseFolder = _path.default.resolve(config.base, cameraKey);
            const now = new Date();
            const nowTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0).valueOf();
            try {
                const folders = (yield readdir(baseFolder)).filter(function(folderName) {
                    const [year, month, day, hour] = folderName.split("_").map(function(num) {
                        return Number.parseInt(num, 10);
                    });
                    const folderTime = new Date(year, month - 1, day, hour, 0, 0, 0).valueOf();
                    const cleanupTime = folderTime + config.maxAge * 1000;
                    return cleanupTime <= nowTime;
                });
                yield folders.reduce(function(memo, folder) {
                    return memo.then(function() {
                        const target = _path.default.resolve(baseFolder, folder);
                        return rimraf(target);
                    });
                }, Promise.resolve());
                console.log("Deleted folders", folders && folders.join(", "));
                yield db.removeOldScenesAndMotion(cameraKey, config.maxAge);
                console.log("Deleted from DB", cameraKey);
            } catch (err) {
                if (err.code !== "ENOENT") throw err;
            }
        }
    });
    const loop = _asyncToGenerator(function*() {
        yield cleanup();
        console.log("Cleanup finished for now");
        yield wait(config.cleanupPolling * 1000);
        loop();
    });
    loop();
});
main();
