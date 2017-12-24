const { Database } = require('sqlite3')
const { createSegment } = require('./segment')

module.exports = class Cache {
    constructor(path) {
        this.db = new Database(path)
        this.hasCreated = {}
    }

    createTable(base, callback) {
        if (this.hasCreated[base]) return
        this.db.prepare(`
            CREATE TABLE IF NOT EXISTS ${base} (
                timestamp int(12) NOT NULL,
                filename varchar(180) NOT NULL,
                extinf varchar(100) NOT NULL,
                duration int(10) NOT NULL,
                PRIMARY KEY (timestamp)
            )`
        ).run(callback)
        this.hasCreated[base] = true
    }

    insertBulk(base, filenames, callback, len = 3 * 24 * 3600) {
        this.createTable(base)
        console.log('received files', filenames.length)
        let i = 0, n = filenames.length
        while (i < n) {
            console.log(`inserting batch ${Math.ceil((i+1) / len)} of ${Math.ceil(n / len)}`)

            console.time('- batch processing')
            const transactions = filenames.slice(i, i += len).forEach((filename) => {
                const segment = createSegment(filename)
                if (!segment) return
                this.db.run(`INSERT OR REPLACE INTO ${base} (filename, timestamp, duration, extinf) VALUES ('${segment.filename}', '${segment.timestamp}', '${segment.duration}', '${segment.extinf}')`)
            }, [])
            console.timeEnd('- batch processing')
        }
    }

    insert(base, filename, callback) {
        const segment = createSegment(filename)
        if (!segment || segment.duration <= 0) return null
        this.createTable(base)
        this.db
            .prepare(`INSERT OR REPLACE INTO ${base} (filename, timestamp, duration, extinf) VALUES (@filename, @timestamp, @duration, @extinf)`)
            .run(segment, callback)
    }

    remove(base, filename, callback) {
        this.db
            .prepare(`DELETE FROM ${base} WHERE filename = ?`)
            .run([filename], callback)
    }

    removeBulk(base, filenames, callback, len = 3 * 24 * 3600) {
        this.createTable(base)
        console.log('received files', filenames.length)
        let i = 0, n = filenames.length
        while (i < n) {
            console.log(`deleting batch ${Math.ceil((i+1) / len)} of ${Math.ceil(n / len)}`)

            console.time('- batch processing')
            const list = filenames.slice(i, i += len).map(({ filename }) => `'${filename}'`)
            console.timeEnd('- batch processing')

            console.time('- remove batch processing')
            this.db.prepare(`DELETE FROM ${base} WHERE filename IN (${list.join(', ')})`).run(callback)
            console.timeEnd('- remove batch processing')
        }
    }

    tooOld(base, maxAge, callback) {
        return this.db
            .prepare(`SELECT filename FROM ${base} WHERE timestamp < ?`)
            .all([(Date.now() / 1000) - maxAge], callback)
    }

    seek(base, from, to, callback) {
        return this.db
            .prepare(`SELECT * FROM ${base} WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp DESC`)
            .all([from, to], callback)
        
    }

    shift(base, shift = 0, callback, limit = 5) {
        return this.db
            .prepare(`SELECT * FROM ${base} WHERE timestamp >= ? ORDER BY timestamp DESC LIMIT ${limit}`)
            .all([(Date.now() / 1000) - shift], callback)
    }
}
