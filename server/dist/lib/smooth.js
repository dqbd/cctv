"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Smooth = void 0;

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var segment = _interopRequireWildcard(require("./segment"));

class Smooth {
  tokens = {};

  constructor(db) {
    this.db = db;
  }

  createSegments(segments) {
    var _segments$map;

    return (_segments$map = segments.map((_ref) => {
      var {
        path
      } = _ref;
      return segment.createSegment(path);
    })) === null || _segments$map === void 0 ? void 0 : _segments$map.filter(function (item) {
      return !!item;
    });
  }

  seek(cameraKey, shift) {
    var _this = this;

    return (0, _asyncToGenerator2.default)(function* () {
      var token = "".concat(cameraKey).concat(shift);
      var current = Math.floor(Date.now() / 1000) - shift;

      var segments = _this.createSegments(yield _this.db.seekFrom(cameraKey, current));

      if (typeof _this.tokens[token] === "undefined" || Math.abs(current - _this.tokens[token].first) > 60) {
        if (segments.length === 0) return {
          segments,
          seq: 0
        };
        _this.tokens[token] = {
          first: segments[0].timestamp,
          next: segments[1] ? segments[1].timestamp : false,
          seq: 0
        };
        return {
          segments,
          seq: _this.tokens[token].seq
        };
      }

      if (_this.tokens[token].next === false) {
        _this.tokens[token].next = segments[1] ? segments[1].timestamp : false;
      }

      if (_this.tokens[token].next <= current) {
        segments = _this.createSegments(yield _this.db.seekFrom(cameraKey, _this.tokens[token].next));
        _this.tokens[token].first = segments[0].timestamp;
        _this.tokens[token].next = segments[1] ? segments[1].timestamp : false;
        _this.tokens[token].seq++;
        return {
          segments,
          seq: _this.tokens[token].seq
        };
      }

      return {
        segments,
        seq: _this.tokens[token].seq
      };
    })();
  }

}

exports.Smooth = Smooth;