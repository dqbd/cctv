module.exports = {
    createSegment(filename) {
        if (!filename || filename.indexOf('.ts') < 0) return null
        let [_, timestamp, duration] = filename.replace('.ts', '').split('_')
        if (!duration || !timestamp) return null

        let extinf = duration.slice(0, -6) + '.' + duration.slice(-6)
        timestamp = Number.parseInt(timestamp, 10)
        duration = Number.parseInt(duration, 10)
        return { filename, timestamp, duration, extinf }
    }
}
