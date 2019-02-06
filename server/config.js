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

    livePort(folder) {
        const data = this.params.targets[folder]
        return data ? data.port : undefined
    }

    maxAge() {
        return this.params.maxAge
    }

    cleanupPolling() {
        return this.params.cleanupPolling
    }

    ipcBase() {
        return this.params.ipcBase
    }

    credential(){
        return this.params.credential
    }
    syncInterval(){
        return this.params.syncInterval
    }
}

module.exports = Config
