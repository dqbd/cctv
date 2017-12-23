const fs = require('fs')
const unquote = require('unquote')

class Config {
    constructor(path) {
        this.params = fs
            .readFileSync(path, { encoding: 'utf-8' })
            .split('\n')
            .reduce((memo, line) => {
                if (line.indexOf('=') > 0) {
                const [key, value] = line.split('=', 2)
                memo[key] = unquote(value)
                }
                return memo
            }, {})
    }

    segmentSize() {
        return Number.parseInt(this.params.SEGMENT_SIZE, 10)
    }

    segmentName() {
        return this.params.SEGMENT_NAME
    }

    ffmpeg() {
        return this.params.FFMPEG_PARAMS
    }

    base() {
        return this.params.BASE
    }

    name() {
        return this.params.MANIFEST_NAME
    }
}

module.exports = Config