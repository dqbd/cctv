"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Database = void 0;

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _path = _interopRequireDefault(require("path"));

var _promiseMysql = _interopRequireDefault(require("promise-mysql"));

var _segment = require("./segment");

class Database {
  constructor(config) {
    this.config = config;
    this.conn = null;
    this.hasCreated = {};
  }

  getScenesTable(cameraKey) {
    return "".concat(cameraKey, "_SCENES");
  }

  getMotionTable(cameraKey) {
    return "".concat(cameraKey, "_MOTION");
  }

  init() {
    var _this = this;

    return (0, _asyncToGenerator2.default)(function* () {
      if (!_this.conn) {
        _this.conn = yield _promiseMysql.default.createConnection(_this.config);
      }
    })();
  }

  close() {
    var _this2 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      if (_this2.conn) {
        _this2.conn.end();
      }
    })();
  }

  createTable(cameraKey) {
    var _this3 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var _this3$conn, _this3$conn2;

      yield _this3.init();
      if (_this3.hasCreated[cameraKey]) return;
      yield (_this3$conn = _this3.conn) === null || _this3$conn === void 0 ? void 0 : _this3$conn.query("\n      CREATE TABLE IF NOT EXISTS ?? (\n        timestamp BIGINT NOT NULL,\n        path varchar(180) NOT NULL,\n        PRIMARY KEY (timestamp)\n      )\n      ENGINE = MyISAM\n    ", [_this3.getScenesTable(cameraKey)]);
      yield (_this3$conn2 = _this3.conn) === null || _this3$conn2 === void 0 ? void 0 : _this3$conn2.query("\n      CREATE TABLE IF NOT EXISTS ?? (\n        timestamp BIGINT NOT NULL,\n        scene NUMERIC(12, 10) NOT NULL,\n        PRIMARY KEY (timestamp)\n      )\n      ENGINE = MyISAM\n    ", [_this3.getMotionTable(cameraKey)]);
      _this3.hasCreated[cameraKey] = true;
    })();
  }

  resetFolder(cameraKey) {
    var _this4 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var _this4$conn, _this4$conn2;

      yield _this4.createTable(cameraKey);
      return Promise.all([(_this4$conn = _this4.conn) === null || _this4$conn === void 0 ? void 0 : _this4$conn.query("TRUNCATE TABLE ??", [_this4.getScenesTable(cameraKey)]), (_this4$conn2 = _this4.conn) === null || _this4$conn2 === void 0 ? void 0 : _this4$conn2.query("TRUNCATE TABLE ??", [_this4.getMotionTable(cameraKey)])]);
    })();
  }

  insertFolder(cameraKey, keyBase, filenames) {
    var _arguments = arguments,
        _this5 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var len = _arguments.length > 3 && _arguments[3] !== undefined ? _arguments[3] : 3 * 24 * 3600;
      yield _this5.createTable(cameraKey);
      console.log("Insert", cameraKey, keyBase, filenames.length);
      var i = 0,
          n = filenames.length;

      while (i < n) {
        var _this5$conn;

        var slices = filenames.slice(i, i += len);
        var queries = slices.reduce((memo, filename) => {
          var segment = (0, _segment.createSegment)(filename);

          var target = _path.default.join(keyBase, _path.default.basename(filename));

          if (!segment) return memo;
          memo.push([segment.timestamp, target]);
          return memo;
        }, []);
        yield (_this5$conn = _this5.conn) === null || _this5$conn === void 0 ? void 0 : _this5$conn.query("INSERT INTO ?? (timestamp, path) VALUES ? ON DUPLICATE KEY UPDATE path = path", [_this5.getScenesTable(cameraKey), queries]);
      }
    })();
  }

  insert(cameraKey, relative) {
    var _this6 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var _this6$conn;

      console.log("Insert", cameraKey, relative);
      yield _this6.createTable(cameraKey);
      var segment = (0, _segment.createSegment)(_path.default.basename(relative));
      if (!segment || segment.duration <= 0) return null;
      return (_this6$conn = _this6.conn) === null || _this6$conn === void 0 ? void 0 : _this6$conn.query("\n      INSERT INTO ?? (path, timestamp)\n      VALUES (?, ?)\n      ON DUPLICATE KEY UPDATE path = ?\n    ", [_this6.getScenesTable(cameraKey), relative, segment.timestamp, relative]);
    })();
  }

  seek(cameraKey, from, to) {
    var _arguments2 = arguments,
        _this7 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var _this7$conn2;

      var limit = _arguments2.length > 3 && _arguments2[3] !== undefined ? _arguments2[3] : 5;
      yield _this7.createTable(cameraKey);

      if (!to) {
        var _this7$conn;

        return (_this7$conn = _this7.conn) === null || _this7$conn === void 0 ? void 0 : _this7$conn.query("\n          SELECT * FROM ??\n          WHERE timestamp >= ?\n          ORDER BY timestamp ASC\n        ", [_this7.getScenesTable(cameraKey), from]);
      }

      return (_this7$conn2 = _this7.conn) === null || _this7$conn2 === void 0 ? void 0 : _this7$conn2.query("\n        SELECT * FROM ??\n        WHERE timestamp >= ? AND timestamp <= ?\n        ORDER BY timestamp ASC\n      ", [_this7.getScenesTable(cameraKey), from, to]);
    })();
  }

  seekFrom(cameraKey, from) {
    var _arguments3 = arguments,
        _this8 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var _this8$conn;

      var limit = _arguments3.length > 2 && _arguments3[2] !== undefined ? _arguments3[2] : 5;
      yield _this8.createTable(cameraKey);
      return (_this8$conn = _this8.conn) === null || _this8$conn === void 0 ? void 0 : _this8$conn.query("\n        SELECT * FROM ??\n        WHERE timestamp >= ?\n        ORDER BY timestamp ASC\n        LIMIT ?\n      ", [_this8.getScenesTable(cameraKey), from, limit]);
    })();
  }

  shift(cameraKey) {
    var _arguments4 = arguments,
        _this9 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var _this9$conn;

      var shift = _arguments4.length > 1 && _arguments4[1] !== undefined ? _arguments4[1] : 0;
      var limit = _arguments4.length > 2 && _arguments4[2] !== undefined ? _arguments4[2] : 5;
      yield _this9.createTable(cameraKey);
      return (_this9$conn = _this9.conn) === null || _this9$conn === void 0 ? void 0 : _this9$conn.query("\n        SELECT * FROM ??\n        WHERE timestamp >= ?\n        ORDER BY timestamp ASC\n        LIMIT ?\n      ", [_this9.getScenesTable(cameraKey), Math.floor(Date.now() / 1000) - shift, limit]);
    })();
  }

  removeOldScenesAndMotion(cameraKey, maxAge) {
    var _this10 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var _this10$conn, _this10$conn2;

      yield _this10.createTable(cameraKey);
      var timestamp = Math.floor(Date.now() / 1000) - maxAge;
      return Promise.all([(_this10$conn = _this10.conn) === null || _this10$conn === void 0 ? void 0 : _this10$conn.query("\n          DELETE FROM ??\n          WHERE timestamp <= ?\n        ", [_this10.getScenesTable(cameraKey), timestamp]), (_this10$conn2 = _this10.conn) === null || _this10$conn2 === void 0 ? void 0 : _this10$conn2.query("\n          DELETE FROM ??\n          WHERE timestamp <= ?\n        ", [_this10.getMotionTable(cameraKey), timestamp])]);
    })();
  }

  getScenes(cameraKey) {
    var _this11 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var _this11$conn;

      yield _this11.createTable(cameraKey);
      return (_this11$conn = _this11.conn) === null || _this11$conn === void 0 ? void 0 : _this11$conn.query("SELECT * FROM ??\n        ORDER BY timestamp DESC\n      ", [_this11.getMotionTable(cameraKey)]);
    })();
  }

  addScene(cameraKey, value) {
    var _this12 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var _this12$conn;

      yield _this12.createTable(cameraKey);
      return (_this12$conn = _this12.conn) === null || _this12$conn === void 0 ? void 0 : _this12$conn.query("\n          INSERT INTO ?? (timestamp, scene)\n          VALUES (?, ?)\n      ", [_this12.getMotionTable(cameraKey), Date.now(), value]);
    })();
  }

}

exports.Database = Database;