import { useEffect, useLayoutEffect, useState } from "react"

async function getServerTimeDiff() {
  const clientStart = Date.now(),
    timeBefore = performance.now()
  const serverReq = await fetch("/api/time")
  const timeAfter = performance.now()

  const roundTripTime = timeAfter - timeBefore
  const incomingTripTime = roundTripTime / 2
  const serverTime = (await serverReq.json()).time - incomingTripTime

  return serverTime - clientStart
}

export function useServerTimeDiff() {
  const [serverTimeDiff, setServerTimeDiff] = useState(0)
  useEffect(() => {
    getServerTimeDiff().then((diff) => setServerTimeDiff(diff))
  }, [])

  return serverTimeDiff
}

export const formatTime = (time: number) => {
  const absTime = Math.abs(time)

  const seconds = Math.floor(absTime / 1000) % 60
  const minutes = Math.floor(absTime / 1000 / 60) % 60
  const hours = Math.floor(absTime / 1000 / 60 / 60) % 24
  const days = Math.floor(absTime / 1000 / 60 / 60 / 24)

  const result = []
  if (seconds > 0 || minutes > 0 || hours > 0) {
    result.unshift(`${seconds.toFixed(0).padStart(2, "0")}s`)
  }

  if (minutes > 0 || hours > 0) {
    result.unshift(`${minutes.toFixed(0).padStart(2, "0")}m`)
  }
  if (hours > 0) {
    result.unshift(`${hours.toFixed(0).padStart(2, "0")}h`)
  }

  if (days > 0) {
    result.unshift(`${days}d`)
  }

  return `${Math.sign(time) < 0 ? "-" : ""}${result.join(" ")}`
}
