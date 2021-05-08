import { createSegments } from "shared/segment"
import { Database } from "shared/database"

export class Smooth {
  tokens: Record<
    string,
    { first: Date; next: Date | undefined; seq: number }
  > = {}

  async seek(db: Database, cameraKey: string, shiftSec: number) {
    const token = `${cameraKey}${shiftSec}`
    const curr = Date.now() - shiftSec * 1000
    let segments = createSegments(
      (await db.seekFrom(cameraKey, Math.floor(curr / 1000))).map(
        (item) => item.path
      )
    )

    if (
      typeof this.tokens[token] === "undefined" ||
      Math.abs(curr - this.tokens[token].first.valueOf()) > 60 * 1000
    ) {
      if (segments.length === 0) return { segments, seq: 0 }

      this.tokens[token] = {
        first: segments[0].timestamp,
        next: segments[1] ? segments[1].timestamp : undefined,
        seq: 0,
      }

      return { segments, seq: this.tokens[token].seq }
    }

    if (this.tokens[token].next == null) {
      this.tokens[token].next = segments[1] ? segments[1].timestamp : undefined
    }

    const next = this.tokens[token].next?.valueOf() ?? 0
    if (next <= curr) {
      segments = createSegments(
        (await db.seekFrom(cameraKey, Math.floor(next / 1000))).map(
          (item) => item.path
        )
      )

      this.tokens[token].first = segments[0].timestamp
      this.tokens[token].next = segments[1] ? segments[1].timestamp : undefined
      this.tokens[token].seq += 1

      return { segments, seq: this.tokens[token].seq }
    }

    return { segments, seq: this.tokens[token].seq }
  }
}
