"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Database = void 0;

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _client = require("@prisma/client");

var _path = _interopRequireDefault(require("path"));

var _segment = require("./segment");

class Database {
  prisma = new _client.PrismaClient();

  resetFolder(cameraKey) {
    var _this = this;

    return (0, _asyncToGenerator2.default)(function* () {
      _this.prisma.scene.deleteMany({
        where: {
          camera: cameraKey
        }
      });
    })();
  }

  insertFolder(camera, keyBase, filenames) {
    var _arguments = arguments,
        _this2 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var len = _arguments.length > 3 && _arguments[3] !== undefined ? _arguments[3] : 3 * 24 * 3600;
      console.log("Insert", camera, keyBase, filenames.length);
      var i = 0;
      var n = filenames.length;

      while (i < n) {
        var slices = filenames.slice(i, i += len);
        var queries = slices.reduce((memo, filename) => {
          var segment = (0, _segment.createSegment)(filename);

          var target = _path.default.join(keyBase, _path.default.basename(filename));

          if (!segment) return memo;
          memo.push([segment.timestamp, target]);
          return memo;
        }, []);
        yield _this2.prisma.$transaction(queries.map((_ref) => {
          var [timestamp, path] = _ref;
          return _this2.prisma.scene.create({
            data: {
              camera,
              path,
              timestamp
            }
          });
        }));
      }
    })();
  }

  insert(camera, path) {
    var _this3 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      console.log("Insert", camera, path);
      var segment = (0, _segment.createSegment)(_path.default.basename(path));
      if (!segment || segment.duration <= 0) return null;
      yield _this3.prisma.scene.upsert({
        where: {
          camera_timestamp: {
            camera,
            timestamp: segment.timestamp
          }
        },
        create: {
          camera,
          path,
          timestamp: segment.timestamp
        },
        update: {
          path
        }
      });
    })();
  }

  seek(camera, fromSec, toSec) {
    var _this4 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var from = new Date(fromSec * 1000);
      var to = new Date(toSec * 1000);
      return _this4.prisma.scene.findMany({
        where: {
          camera,
          timestamp: toSec ? {
            gte: from,
            lte: to
          } : {
            gte: from
          }
        },
        orderBy: {
          timestamp: "asc"
        }
      });
    })();
  }

  seekFrom(camera, fromSec) {
    var _arguments2 = arguments,
        _this5 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var limit = _arguments2.length > 2 && _arguments2[2] !== undefined ? _arguments2[2] : 5;
      var from = new Date(fromSec * 100);
      return _this5.prisma.scene.findMany({
        where: {
          camera,
          timestamp: {
            gte: from
          }
        },
        orderBy: {
          timestamp: "asc"
        },
        take: limit
      });
    })();
  }

  shift(camera) {
    var _arguments3 = arguments,
        _this6 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var shiftSec = _arguments3.length > 1 && _arguments3[1] !== undefined ? _arguments3[1] : 0;
      var limit = _arguments3.length > 2 && _arguments3[2] !== undefined ? _arguments3[2] : 5;
      var shift = shiftSec * 1000;
      return _this6.prisma.scene.findMany({
        where: {
          camera,
          timestamp: {
            gte: new Date(Date.now() - shift)
          }
        },
        orderBy: {
          timestamp: "asc"
        },
        take: limit
      });
    })();
  }

  removeOldScenesAndMotion(camera, maxAgeSec) {
    var _this7 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var maxAge = maxAgeSec * 1000;
      return _this7.prisma.scene.deleteMany({
        where: {
          camera,
          timestamp: {
            lte: new Date(Date.now() - maxAge)
          }
        }
      });
    })();
  }

}

exports.Database = Database;