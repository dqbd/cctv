import { createContext } from "react"
import NoSleep from "nosleep.js"

export const SleepContext = createContext<NoSleep | undefined>(undefined)
