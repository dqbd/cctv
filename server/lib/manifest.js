class Manifest {
    constructor(config) {
        this.config = config;
    }

    getManifest(token, segments, seq, end = false) {
        const { tokens, config } = this
        const buffer = [
            '#EXTM3U',
            '#EXT-X-VERSION:3',
            `#EXT-X-TARGETDURATION:${config.segmentSize}`,
            `#EXT-X-MEDIA-SEQUENCE:${seq}`,
        ]
        segments.forEach(({ filename, extinf, path }) => {
            buffer.push(`#EXTINF:${extinf || '4.000'},`)
	        if (filename) {
                buffer.push(filename)
            } else {
                buffer.push(path)
            }
        })

        if (end) {
            buffer.push('#EXT-X-ENDLIST')
        }

        return buffer.join('\n') + '\n'
    }
}

module.exports = Manifest
