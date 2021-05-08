import { createContext } from "react"

export const DataProvider = createContext<{
  streams: { key: string; name: string; color: string }[]
}>({ streams: [] })
