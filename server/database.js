const Database = require('better-sqlite3')
const { createSegment } = require('./segment')

module.exports = class Cache {
    constructor(path) {
        this.db = new Database(path)
        this.hasCreated = {}
    }

    createTable(base) {
        if (this.hasCreated[base]) return
        this.db.prepare(`
            CREATE TABLE IF NOT EXISTS ${base} (
                timestamp int(12) NOT NULL,
                filename varchar(180) NOT NULL,
                extinf varchar(100) NOT NULL,
                duration int(10) NOT NULL,
                PRIMARY KEY (timestamp)
            )`
        ).run()
        this.hasCreated[base] = true
    }

    insert(base, filename) {
        const segment = createSegment(filename)
        if (!segment) return null
        this.createTable(base)
        this.db
            .prepare(`INSERT OR REPLACE INTO ${base} (filename, timestamp, duration, extinf) VALUES (@filename, @timestamp, @duration, @extinf)`)
            .run(segment)
    }

    remove(base, filename) {
        this.db
            .prepare(`DELETE FROM ${base} WHERE filename = ?`)
            .run([filename])
    }

    tooOld(base, maxAge) {
        return this.db
            .prepare(`SELECT filename FROM ${base} WHERE timestamp < ?`)
            .all([(Date.now() / 1000) - maxAge])
    }

    seek(base, from, to) {
        return this.db
            .prepare(`SELECT * FROM ${base} WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp DESC`)
            .all([from, to])
        
    }

    shift(base, shift = 0, limit = 5) {
        return this.db
            .prepare(`SELECT * FROM ${base} WHERE timestamp >= ? ORDER BY timestamp DESC LIMIT ${limit}`)
            .all([(Date.now() / 1000) - shift])
    }
}