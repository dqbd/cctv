const segment = require('./segment.js')

class Smooth {
  constructor(db) {
    this.tokens = {}
    this.db = db
  }

  createSegments(segments) {
    return segments.map(({ path }) => segment.createSegment(path))
  }

  async seek(base, shift) {
    const token = `${base}${shift}`
    let current = Math.floor(Date.now() / 1000) - shift
    let segments = this.createSegments(await this.db.seekFrom(base, current))

    if (typeof this.tokens[token] === 'undefined' || Math.abs(current - this.tokens[token].first) > 60) {
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
      segments = this.createSegments(await this.db.seekFrom(base, this.tokens[token].next))

      this.tokens[token].first = segments[0].timestamp
      this.tokens[token].next = segments[1] ? segments[1].timestamp : false
      this.tokens[token].seq++

      return { segments, seq: this.tokens[token].seq }
    } 

    return { segments, seq: this.tokens[token].seq }
  }
}

module.exports = Smooth