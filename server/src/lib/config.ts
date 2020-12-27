import config from "../../config"
import * as z from "zod"
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
  }).nonstrict(),
})

const validConfig = configShape.parse(config)

export function getConfig() {
  return validConfig
}