"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Manifest = void 0;

class Manifest {
  constructor(config) {
    this.config = config;
  }

  getManifest(segments, seq) {
    var end = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    var {
      config
    } = this;
    var buffer = ["#EXTM3U", "#EXT-X-VERSION:3", "#EXT-X-TARGETDURATION:".concat(config.segmentSize), "#EXT-X-MEDIA-SEQUENCE:".concat(seq)];
    segments.forEach(_ref => {
      var {
        filename,
        extinf
      } = _ref;
      buffer.push("#EXTINF:".concat(extinf || "4.000", ","));
      buffer.push(filename);
    });

    if (end) {
      buffer.push("#EXT-X-ENDLIST");
    }

    return buffer.join("\n") + "\n";
  }

}

exports.Manifest = Manifest;