import { z } from "zod"

export const EnvDto = z.object({
  CONFIG_PATH: z.string().min(1),
  AUTH_CONFIG_PATH: z.string().min(1),
})

export type EnvTypes = z.infer<typeof EnvDto>
