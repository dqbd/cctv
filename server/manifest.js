const tokens = {}

class Manifest {
    constructor(config) {
        this.config = config;
        this.tokens = {}
    }

    clearTokens() {
        this.tokens = {}
    }

    getManifest(token, segments) {
        const { tokens, config } = this
        const buffer = [
            '#EXTM3U',
            '#EXT-X-VERSION:3',
            `#EXT-X-TARGETDURATION:${config.segmentSize()}`,
            '#EXT-X-MEDIA-SEQUENCE:',
        ]

        let hash = ''

        segments.forEach(({ filename, timestamp, duration, extinf }) => {
            hash += filename
            buffer.push(`#EXTINF:${extinf},`)
            buffer.push(filename)
        })

        if (typeof tokens[token] === 'undefined') {
            tokens[token] = { seq: 0, hash }
        } else if (tokens[token] !== hash) {
            tokens[token].seq += 1
            tokens[token].hash = hash
        }

        buffer[2] += tokens[token].seq

        return buffer.join('\n')
    }
}

module.exports = Manifest
