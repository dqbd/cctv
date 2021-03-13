"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _express = _interopRequireDefault(require("express"));

var _path = _interopRequireDefault(require("path"));

var _cors = _interopRequireDefault(require("cors"));

var _fs = _interopRequireDefault(require("fs"));

var _database = require("../lib/database");

var _manifest = require("../lib/manifest");

var _smooth = require("../lib/smooth");

var _preview = require("../lib/preview");

var _config = require("../lib/config");

var config = (0, _config.getConfig)();

var main = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2.default)(function* () {
    var manifest = new _manifest.Manifest(config);
    var db = new _database.Database(config.auth.database);
    var smooth = new _smooth.Smooth(db);
    var app = (0, _express.default)();
    app.use((0, _cors.default)());
    app.get("/streams", (_, res) => {
      res.set("Content-Type", "application/json");
      res.send({
        data: Object.entries(config.targets).map((_ref2) => {
          var [key, {
            name
          }] = _ref2;
          return {
            key,
            name
          };
        })
      });
    });
    app.get("/data/:folder/slice.m3u8", /*#__PURE__*/function () {
      var _ref3 = (0, _asyncToGenerator2.default)(function* (req, res, next) {
        if (!req.query.from) return next();
        var {
          folder
        } = req.params;
        var {
          from,
          to
        } = req.query;
        if (!folder || !from || !to || typeof from !== "string") return res.status(400).send("No query parameters set");
        res.set("Content-Type", "application/x-mpegURL");
        res.send(manifest.getManifest(yield db.seek(folder, Number(from), Number(to)), 1, true));
      });

      return function (_x, _x2, _x3) {
        return _ref3.apply(this, arguments);
      };
    }());
    app.get("/data/:folder/stream.m3u8", /*#__PURE__*/function () {
      var _ref4 = (0, _asyncToGenerator2.default)(function* (req, res) {
        var {
          folder
        } = req.params;
        var shift = req.query.shift && Number(req.query.shift) || 0;
        var from = req.query.from;
        if (!folder) return res.status(400).send("Invalid parameters");
        var {
          seq,
          segments
        } = yield smooth.seek(folder, shift);
        res.set("Content-Type", "application/x-mpegURL");

        if (shift === 0) {
          var file = _fs.default.readFileSync(_path.default.resolve(config.base, folder, config.manifest), {
            encoding: "utf-8"
          });

          res.send(file.split(config.base).join("/data"));
        } else {
          res.send(manifest.getManifest(segments, seq));
        }
      });

      return function (_x4, _x5) {
        return _ref4.apply(this, arguments);
      };
    }());
    app.get("/data/:folder/:date/:file", (req, res, next) => {
      var {
        folder,
        date,
        file
      } = req.params;
      if (file.indexOf(".ts") < 0) return next();
      res.sendFile(_path.default.join(folder, date, file), {
        root: config.base
      });
    });
    app.get("/frame/:folder", /*#__PURE__*/function () {
      var _ref5 = (0, _asyncToGenerator2.default)(function* (req, res) {
        var {
          folder
        } = req.params;
        var {
          refresh
        } = req.query;

        if (!(folder in config.targets)) {
          res.status(404);
          res.send();
          return;
        }

        try {
          var payload = yield (0, _preview.getScreenshot)(config.targets[folder].onvif, !!refresh);
          res.setHeader("Content-Type", "image/jpeg");
          res.setHeader("Content-Transfer-Encoding", "binary");
          res.send(payload);
        } catch (err) {
          console.log(err);
          res.status(500);
          res.send();
        }
      });

      return function (_x6, _x7) {
        return _ref5.apply(this, arguments);
      };
    }());
    app.use(_express.default.static(_path.default.resolve(__dirname, "../../../", "client", "build")));
    app.get("*", (_, res) => res.sendFile(_path.default.resolve(__dirname, "../../../", "client", "build", "index.html")));
    app.listen(config.port, () => "Listening at ".concat(config.port));
  });

  return function main() {
    return _ref.apply(this, arguments);
  };
}();

main();