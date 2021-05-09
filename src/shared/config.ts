import userConfig from "../../config"
import * as z from "zod"

export const config = z
  .object({
    base: z.string(),
    manifest: z.string(),
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
  .parse(userConfig)
