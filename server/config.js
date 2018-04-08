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
        return this.params.maxAge
    }

    cleanupPolling() {
        return this.params.cleanupPolling
    }
    credential(){
        return this.params.credential
    }
    syncInterval(){
        return this.params.syncInterval
    }
}

module.exports = Config
