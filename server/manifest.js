const tokens = {}

class Manifest {
    constructor(config) {
        this.config = config;
        this.tokens = {}
    }

    clearTokens() {
        this.tokens = {}
    }

    getManifest(token, segments, end = false) {
        const { tokens, config } = this
        const buffer = [
            '#EXTM3U',
            '#EXT-X-VERSION:3',
            `#EXT-X-TARGETDURATION:${config.segmentSize()}`,
            '#EXT-X-MEDIA-SEQUENCE:',
        ]

        let hash = ''

        segments.forEach(({ filename, timestamp, duration, extinf }) => {
            hash = `${hash}${filename}`
            buffer.push(`#EXTINF:${extinf},`)
            buffer.push(filename)
        })

        console.log('HASH for', token, hash)

        if (typeof tokens[token] === 'undefined') {
            tokens[token] = { seq: 0, hash }
            console.log('HASH undetected')
        } else if (tokens[token].hash !== hash) {
            tokens[token].seq += 1
            tokens[token].hash = hash
            console.log('HASH new')
        } else {
            console.log('HASH reusing')
        }

        buffer[3] += tokens[token].seq

        if (end) {
            buffer.push('#EXT-X-ENDLIST')
        }

        return buffer.join('\n') + '\n'
    }
}

module.exports = Manifest
