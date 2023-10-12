import path from "path"

export class Segment {
  private timestamp: string
  private duration: string
  sequence: string

  constructor(
    public filename: string,
    public targetDuration: number,
    public pdt: Date | null,
  ) {
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

  static parseSegment(
    filename: string,
    targetDuration: number,
    pdt: Date | null,
  ) {
    try {
      return new Segment(filename, targetDuration, pdt)
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

  getDate() {
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
  },
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
    if (segment.pdt != null) {
      buffer.push(`#EXT-X-PROGRAM-DATE-TIME:${segment.pdt.toISOString()}`)
    }
    buffer.push(`#EXTINF:${segment.getExtInf()},`)
    buffer.push(segment.filename)
  })

  if (options?.end) {
    buffer.push("#EXT-X-ENDLIST")
  }

  return buffer.join("\n") + "\n"
}

function isManifestPDT(x: string | null) {
  return x?.startsWith("#EXT-X-PROGRAM-DATE-TIME") ?? false
}

function parseManifestTag(x: string | null) {
  return x?.split(":").slice(1).join(":") ?? null
}

export function parseManifest(manifest: string) {
  const lines = manifest
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => Boolean(line))

  const targetDuration = lines
    .filter((line) => line.startsWith("#EXT-X-TARGETDURATION"))
    .map((i) => Number.parseInt(parseManifestTag(i) ?? "", 10))
    .filter((i) => !Number.isNaN(i))
    .shift()

  if (targetDuration == null) return null
  const pairs: Array<string | null> = lines.filter(
    (line) => line.indexOf(".ts") >= 0 || isManifestPDT(line),
  )

  for (let i = pairs.length - 1; i >= 0; i--) {
    const prev = isManifestPDT(pairs[i - 1])
    const curr = isManifestPDT(pairs[i])
    if (prev === curr) pairs.splice(i, 0, null)
    if (curr) pairs[i] = parseManifestTag(pairs[i]) ?? null
  }

  const files = pairs.filter((x, i): x is string => i % 2 === 1 && x != null)
  const pdts = pairs.filter((_, i) => i % 2 === 0)
  return { targetDuration, files, pdts }
}
