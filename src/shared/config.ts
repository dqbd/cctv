import userConfig from "../../config"
import userAuthConfig from "../../config.auth"
import { z } from "zod"
import { Knex } from "knex"

const ConfigDto = z.object({
  base: z.string(),
  database: z.union([
    z.object({
      client: z.union([
        z.literal("pg"),
        z.literal("mysql"),
        z.literal("mysql2"),
      ]),
      connection: z.object({
        host: z.string(),
        port: z.number(),
        user: z.string(),
        password: z.string(),
        database: z.string(),
      }),
    }),
    z.object({
      client: z.literal("sqlite"),
      connection: z.object({
        filename: z.string(),
      }),
    }),
  ]),
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

const AuthConfigDto = z.object({
  onvif: z.object({
    username: z.string(),
    password: z.string(),
  }),
})

export const config = ConfigDto.parse(userConfig)
export const authConfig = AuthConfigDto.parse(userAuthConfig)
