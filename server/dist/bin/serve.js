"use strict";
var _express = _interopRequireDefault(require("express"));
var _path = _interopRequireDefault(require("path"));
var _cors = _interopRequireDefault(require("cors"));
var _fs = _interopRequireDefault(require("fs"));
var _database = require("../lib/database");
var _manifest = require("../lib/manifest");
var _smooth = require("../lib/smooth");
var _preview = require("../lib/preview");
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
const config = _config.getConfig();
const main = _asyncToGenerator(function*() {
    const manifest = new _manifest.Manifest(config);
    const db = new _database.Database(config.auth.database);
    const smooth = new _smooth.Smooth(db);
    const app = _express.default();
    app.use(_cors.default());
    app.get("/streams", function(_, res) {
        res.set("Content-Type", "application/json");
        res.send({
            data: Object.entries(config.targets).map(function([key, { name  }]) {
                return {
                    key,
                    name
                };
            })
        });
    });
    app.get("/data/:folder/slice.m3u8", _asyncToGenerator(function*(req, res, next) {
        if (!req.query.from) return next();
        const { folder  } = req.params;
        const { from , to  } = req.query;
        if (!folder || !from || !to || typeof from !== "string") return res.status(400).send("No query parameters set");
        res.set("Content-Type", "application/x-mpegURL");
        res.send(manifest.getManifest((yield db.seek(folder, Number(from), Number(to))), 1, true));
    }));
    app.get("/data/:folder/stream.m3u8", _asyncToGenerator(function*(req, res) {
        const { folder  } = req.params;
        const shift = req.query.shift && Number(req.query.shift) || 0;
        if (!folder) return res.status(400).send("Invalid parameters");
        const { seq , segments  } = yield smooth.seek(folder, shift);
        res.set("Content-Type", "application/x-mpegURL");
        if (shift === 0) {
            const file = _fs.default.readFileSync(_path.default.resolve(config.base, folder, config.manifest), {
                encoding: "utf-8"
            });
            res.send(file.split(config.base).join("/data"));
        } else {
            res.send(manifest.getManifest(segments, seq));
        }
    }));
    app.get("/data/:folder/:date/:file", function(req, res, next) {
        const { folder , date , file  } = req.params;
        if (file.indexOf(".ts") < 0) return next();
        res.sendFile(_path.default.join(folder, date, file), {
            root: config.base
        });
    });
    app.get("/frame/:folder", _asyncToGenerator(function*(req, res) {
        const { folder  } = req.params;
        const { refresh  } = req.query;
        if (!(folder in config.targets)) {
            res.status(404);
            res.send();
            return;
        }
        try {
            const payload = yield _preview.getScreenshot(config.targets[folder].onvif, !!refresh);
            res.setHeader("Content-Type", "image/jpeg");
            res.setHeader("Content-Transfer-Encoding", "binary");
            res.send(payload);
        } catch (err) {
            console.log(err);
            res.status(500);
            res.send();
        }
    }));
    app.use(_express.default.static(_path.default.resolve(__dirname, "../../../", "client", "build")));
    app.get("*", function(_, res) {
        return res.sendFile(_path.default.resolve(__dirname, "../../../", "client", "build", "index.html"));
    });
    app.listen(config.port, function() {
        return `Listening at ${config.port}`;
    });
});
main();
