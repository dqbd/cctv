import { useEffect, useState } from "react"

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
