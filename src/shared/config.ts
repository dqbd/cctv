import { z } from "zod"
import { promises as fs } from "fs"
import * as path from "path"
import { createContext } from "react"

export const ConfigDto = z.object({
  maxAge: z.number(),
  cleanupPolling: z.number(),
  targets: z.record(
    z.object({
      name: z.string(),
      source: z.string(),
    }),
  ),
})

export const AuthConfigDto = z.object({
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
})

export const EnvDto = z.object({
  CONFIG_PATH: z.string().default("/cctv/config/config.json"),
  CONFIG_BASE64: z.string().optional(),
  CCTV_BASE_FOLDER: z.string(),
  MYSQL_HOST: z.string(),
  MYSQL_PORT: z.string(),
  MYSQL_USER: z.string(),
  MYSQL_PASSWORD: z.string(),
  MYSQL_DATABASE: z.string(),
})

export type EnvTypes = z.infer<typeof EnvDto>

export async function loadServerConfig() {
  if (process.browser)
    throw new Error("Cannot load server config from client bundle")

  const env = EnvDto.parse(process.env)

  const config = JSON.parse(
    env.CONFIG_BASE64 != null
      ? Buffer.from(env.CONFIG_BASE64, "base64").toString("utf-8")
      : await fs.readFile(path.resolve(env.CONFIG_PATH), { encoding: "utf-8" }),
  )

  return {
    baseFolder: env.CCTV_BASE_FOLDER,
    config: ConfigDto.parse(config),
    authConfig: AuthConfigDto.parse({
      database: {
        client: "mysql2",
        connection: {
          host: env.MYSQL_HOST,
          port: Number.parseInt(env.MYSQL_PORT, 10),
          user: env.MYSQL_USER,
          password: env.MYSQL_PASSWORD,
          database: env.MYSQL_DATABASE,
        },
      },
    }),
  }
}

// @ts-expect-error Force context
export const ConfigContext = createContext<z.infer<typeof ConfigDto>>(null)
