import * as segment from "./segment"
import { Database } from "./database"

export class Smooth {
  tokens: { [key: string]: any } = {}

  constructor(private db: Database) {}

  createSegments(segments: { path: string }[]) {
    return segments
      .map(({ path }) => segment.createSegment(path))
      ?.filter(function (item): item is NonNullable<typeof item> {
        return !!item
      })
  }

  async seek(cameraKey: string, shift: number) {
    const token = `${cameraKey}${shift}`
    let current = Math.floor(Date.now() / 1000) - shift
    let segments = this.createSegments(
      await this.db.seekFrom(cameraKey, current)
    )

    if (
      typeof this.tokens[token] === "undefined" ||
      Math.abs(current - this.tokens[token].first) > 60
    ) {
      if (segments.length === 0) return { segments, seq: 0 }
      this.tokens[token] = {
        first: segments[0].timestamp,
        next: segments[1] ? segments[1].timestamp : false,
        seq: 0,
      }

      return { segments, seq: this.tokens[token].seq }
    }

    if (this.tokens[token].next === false) {
      this.tokens[token].next = segments[1] ? segments[1].timestamp : false
    }

    if (this.tokens[token].next <= current) {
      segments = this.createSegments(
        await this.db.seekFrom(cameraKey, this.tokens[token].next)
      )

      this.tokens[token].first = segments[0].timestamp
      this.tokens[token].next = segments[1] ? segments[1].timestamp : false
      this.tokens[token].seq++

      return { segments, seq: this.tokens[token].seq }
    }

    return { segments, seq: this.tokens[token].seq }
  }
}
