import path from "path"

export class Segment {
  timestamp: string
  sequence: string
  duration: string

  constructor(public filename: string, public targetDuration: number) {
    if (filename.indexOf(".ts") < 0) throw new Error("File is not a .ts file")
    const [_, timestamp, sequence, duration] = path
      .basename(filename)
      .replace(".ts", "")
      .split("_")

    if (timestamp == null || sequence == null || duration == null)
      throw new Error("Missing sections from segment")

    this.timestamp = timestamp
    this.sequence = sequence
    this.duration = duration
  }

  static parseSegment(filename: string, targetDuration: number) {
    try {
      return new Segment(filename, targetDuration)
    } catch (error) {
      return null
    }
  }

  getExtInf(): string {
    return (
      (this.duration.slice(0, -6) || "0") +
      "." +
      this.duration.slice(-6).padStart(6, "0")
    )
  }

  getDate(): Date {
    return new Date(Number.parseInt(this.timestamp, 10) * 1000)
  }
}

export function isSegment(x: Segment | null): x is Segment {
  return x != null
}

export function getManifest(
  segments: Segment[],
  options?: {
    offset?: number
    end?: boolean
  }
) {
  const targetDuration = segments
    .map((i) => i.targetDuration)
    .reduce((min, i) => Math.min(min, i), Infinity)

  const buffer = [
    "#EXTM3U",
    `#EXT-X-VERSION:${options?.offset == null ? 3 : 6}`,
    `#EXT-X-TARGETDURATION:${targetDuration}`,
    `#EXT-X-MEDIA-SEQUENCE:${segments[0].sequence}`,
  ]

  if (options?.offset != null) {
    buffer.push(`#EXT-X-START:TIME-OFFSET=${options.offset},PRECISE=YES`)
  }

  segments.forEach((segment) => {
    buffer.push(`#EXTINF:${segment.getExtInf()},`)
    buffer.push(segment.filename)
  })

  if (options?.end) {
    buffer.push("#EXT-X-ENDLIST")
  }

  return buffer.join("\n") + "\n"
}

export function parseManifest(manifest: string) {
  const lines = manifest
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => Boolean(line))

  const files = lines.filter((line) => line.indexOf(".ts") >= 0)
  const targetDuration = lines
    .filter((line) => line.startsWith("#EXT-X-TARGETDURATION"))
    .map((i) => Number.parseInt(i.split(":").pop() ?? "", 10))
    .filter((i) => !Number.isNaN(i))
    .shift()

  if (targetDuration == null || lines == null) return null
  return {
    targetDuration,
    files,
  }
}
