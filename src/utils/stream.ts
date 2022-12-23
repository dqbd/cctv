import { createContext } from "react"

export type ManifestArgs =
  | { from: number; to: number }
  | { from: number; length: number }
  | { shift: number }

export const StreamContext = createContext<{
  streams: { key: string; name: string; color: string }[]
}>({ streams: [] })
