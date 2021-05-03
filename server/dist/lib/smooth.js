"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Smooth = void 0;

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var segment = _interopRequireWildcard(require("./segment"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

class Smooth {
  constructor(db) {
    this.db = db;
    (0, _defineProperty2.default)(this, "tokens", {});
  }

  createSegments(segments) {
    var _segments$map;

    return (_segments$map = segments.map(_ref => {
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