"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.createSegment = createSegment;
var _path = _interopRequireDefault(require("path"));
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function createSegment(filename) {
    if (!filename || filename.indexOf(".ts") < 0) return null;
    let [_, timestamp, duration] = _path.default.basename(filename).replace(".ts", "").split("_");
    if (!duration || !timestamp) return null;
    let extinf = duration.slice(0, -6) + "." + duration.slice(-6);
    return {
        filename,
        timestamp: Number(timestamp),
        duration: Number.parseInt(duration, 10),
        extinf
    };
}
