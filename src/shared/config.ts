import { z } from "zod"
import { promises as fs } from "fs"
import * as path from "path"
import { createContext } from "react"

export const ConfigDto = z.object({
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

export const AuthConfigDto = z.object({
  onvif: z.object({
    username: z.string(),
    password: z.string(),
  }),
})

export const EnvDto = z.object({
  CONFIG_PATH: z.string().min(1),
  AUTH_CONFIG_PATH: z.string().min(1),
})

export type EnvTypes = z.infer<typeof EnvDto>

export function parseConfig(props: { config: unknown; authConfig: unknown }) {
  return {
    config: ConfigDto.parse(props.config),
    authConfig: AuthConfigDto.parse(props.authConfig),
  }
}

export async function loadServerConfig() {
  if (process.browser)
    throw new Error("Cannot load server config from client bundle")

  EnvDto.parse(process.env)

  const config = JSON.parse(
    await fs.readFile(path.resolve(process.env.CONFIG_PATH), {
      encoding: "utf-8",
    })
  )

  const authConfig = JSON.parse(
    await fs.readFile(path.resolve(process.env.AUTH_CONFIG_PATH), {
      encoding: "utf-8",
    })
  )

  return parseConfig({ config, authConfig })
}

// @ts-expect-error Force context
export const ConfigContext = createContext<z.infer<typeof ConfigDto>>(null)
