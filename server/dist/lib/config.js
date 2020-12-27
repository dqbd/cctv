"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getConfig = getConfig;
var _config = _interopRequireDefault(require("../../config"));
var z = _interopRequireWildcard(require("zod"));
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
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
const configShape = z.object({
    base: z.string(),
    manifest: z.string(),
    segmentName: z.string(),
    maxAge: z.number(),
    syncInterval: z.number(),
    cleanupPolling: z.number(),
    segmentSize: z.number(),
    port: z.number().positive(),
    targets: z.record(z.object({
        name: z.string(),
        onvif: z.string()
    })),
    auth: z.object({
        database: z.object({
            host: z.string(),
            user: z.string(),
            password: z.string(),
            database: z.string()
        }),
        onvif: z.object({
            username: z.string(),
            password: z.string()
        })
    }).nonstrict()
});
const validConfig = configShape.parse(_config.default);
function getConfig() {
    return validConfig;
}
