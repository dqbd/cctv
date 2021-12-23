import userConfig from "../../config"
import userAuthConfig from "../../config.auth"
import * as z from "zod"
import { Knex } from "knex"

export const config = z
  .object({
    base: z.string(),
    database: z.string(),
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
  })
  .parse(userConfig)

export const dbConfig: Knex.Config = {
  client: "sqlite",
  connection: { filename: userConfig.database },
}

export const authConfig = z
  .object({
    onvif: z.object({
      username: z.string(),
      password: z.string(),
    }),
  })
  .parse(userAuthConfig)
