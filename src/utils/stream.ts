import { createContext } from "react"

export const StreamContext = createContext<{
  streams: { key: string; name: string; color: string }[]
}>({ streams: [] })
