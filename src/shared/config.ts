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
  targets: z.record(
    z.object({
      name: z.string(),
      onvif: z.string(),
    })
  ),
  auth: z.object({
    onvif: z.object({
      username: z.string(),
      password: z.string(),
    }),
  }),
})

const validConfig = configShape.parse(config)

export function getConfig() {
  return validConfig
}
