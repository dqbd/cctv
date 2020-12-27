import path from "path"

export function createSegment(filename: string): {
  filename: string
  timestamp: number
  duration: number
  extinf: string
} | null {
  if (!filename || filename.indexOf(".ts") < 0) return null
  let [_, timestamp, duration] = path
    .basename(filename)
    .replace(".ts", "")
    .split("_")
  if (!duration || !timestamp) return null

  let extinf = duration.slice(0, -6) + "." + duration.slice(-6)
  return {
    filename,
    timestamp: Number(timestamp),
    duration: Number.parseInt(duration, 10),
    extinf
  }
}
