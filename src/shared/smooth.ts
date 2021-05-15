import { createSegments } from "shared/segment"
import { Database } from "shared/database"

export class Smooth {
  tokens: Record<string, { date: Date; seq: number } | undefined> = {}

  async seek(db: Database, cameraKey: string, shiftSec: number) {
    const tokenId = `${cameraKey}${shiftSec}`
    const timestampSec = Math.floor((Date.now() - shiftSec * 1000) / 1000)

    const segments = createSegments(
      (await db.seekFrom(cameraKey, timestampSec)).map((item) => item.path)
    )

    const compareDate = segments[0]?.timestamp
    if (!compareDate) return { segments, seq: 0 }

    let token = this.tokens[tokenId]
    if (token == null || compareDate.valueOf() !== token.date.valueOf()) {
      this.tokens[tokenId] = token = {
        date: compareDate,
        seq: (token?.seq ?? 0) + 1,
      }
    }

    return { segments, seq: token.seq }
  }
}
