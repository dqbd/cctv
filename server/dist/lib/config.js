"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getConfig = getConfig;

var _config = _interopRequireDefault(require("../../config"));

var z = _interopRequireWildcard(require("zod"));

var configShape = z.object({
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
var validConfig = configShape.parse(_config.default);

function getConfig() {
  return validConfig;
}