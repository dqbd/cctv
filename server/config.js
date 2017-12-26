const fs = require('fs')
const unquote = require('unquote')

class Config {
    constructor(data) {
        this.params = data
    }

    segmentSize() {
        return this.params.segmentSize
    }

    segmentName() {
        return this.params.segmentName
    }

    base() {
        return this.params.base
    }

    name() {
        return this.params.manifest
    }

    port() {
        return this.params.port
    }

    targets() {
        return this.params.targets
    }

    source(folder) {
        const data = this.params.targets[folder]
        return data ? data.source : undefined
    }

    maxAge() {
        this.params.maxAge
    }

    cleanupPolling() {
        this.params.cleanupPolling
    }
}

module.exports = Config