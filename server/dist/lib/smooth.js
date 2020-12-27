"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
var segment = _interopRequireWildcard(require("./segment"));
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
function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
        return obj;
    } else {
        var newObj = {
        };
        if (obj != null) {
            for(var key in obj){
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {
                    };
                    if (desc.get || desc.set) {
                        Object.defineProperty(newObj, key, desc);
                    } else {
                        newObj[key] = obj[key];
                    }
                }
            }
        }
        newObj.default = obj;
        return newObj;
    }
}
class Smooth {
    createSegments(segments) {
        var ref;
        return (ref = segments.map(({ path  })=>segment.createSegment(path)
        )) === null || ref === void 0 ? void 0 : ref.filter(function(item) {
            return !!item;
        });
    }
    seek(cameraKey, shift) {
        return _asyncToGenerator((function*() {
            const token = `${cameraKey}${shift}`;
            let current = Math.floor(Date.now() / 1000) - shift;
            let segments = this.createSegments((yield this.db.seekFrom(cameraKey, current)));
            if (typeof this.tokens[token] === "undefined" || Math.abs(current - this.tokens[token].first) > 60) {
                if (segments.length === 0) return {
                    segments,
                    seq: 0
                };
                this.tokens[token] = {
                    first: segments[0].timestamp,
                    next: segments[1] ? segments[1].timestamp : false,
                    seq: 0
                };
                return {
                    segments,
                    seq: this.tokens[token].seq
                };
            }
            if (this.tokens[token].next === false) {
                this.tokens[token].next = segments[1] ? segments[1].timestamp : false;
            }
            if (this.tokens[token].next <= current) {
                segments = this.createSegments((yield this.db.seekFrom(cameraKey, this.tokens[token].next)));
                this.tokens[token].first = segments[0].timestamp;
                this.tokens[token].next = segments[1] ? segments[1].timestamp : false;
                this.tokens[token].seq++;
                return {
                    segments,
                    seq: this.tokens[token].seq
                };
            }
            return {
                segments,
                seq: this.tokens[token].seq
            };
        }).bind(this))();
    }
    constructor(db){
        this.db = db;
        this.tokens = {
        };
    }
}
exports.Smooth = Smooth;
