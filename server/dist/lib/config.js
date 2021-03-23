"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getConfig = getConfig;

var _config = _interopRequireDefault(require("../../config"));

var z = _interopRequireWildcard(require("zod"));

// @ts-expect-error Loading config file is fine
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
    onvif: z.object({
      username: z.string(),
      password: z.string()
    })
  })
});
var validConfig = configShape.parse(_config.default);

function getConfig() {
  return validConfig;
}