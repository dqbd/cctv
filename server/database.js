const Database = require('better-sqlite3')
const { createSegment } = require('./segment')

module.exports = class Cache {
    constructor(path, options) {
        this.db = new Database(path, options)
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

    insertBulk(base, filenames, len = 3 * 24 * 3600) {
        this.createTable(base)
        console.log('received files', filenames.length)
        let i = 0, n = filenames.length
        while (i < n) {
            console.log(`inserting batch ${Math.ceil((i+1) / len)} of ${Math.ceil(n / len)}`)

            console.time('- batch processing')
            const transactions = filenames.slice(i, i += len).reduce((memo, filename) => {
                const segment = createSegment(filename)
                if (!segment) return memo
                memo.push(`INSERT OR REPLACE INTO ${base} (filename, timestamp, duration, extinf) VALUES ('${segment.filename}', '${segment.timestamp}', '${segment.duration}', '${segment.extinf}')`)
                return memo
            }, [])
            console.timeEnd('- batch processing')
            
            console.time('- insert batch processing')
            this.db.transaction(transactions).run()
            console.timeEnd('- insert batch processing')
        }
    }

    insert(base, filename) {
        const segment = createSegment(filename)
        if (!segment || segment.duration <= 0) return null
        this.createTable(base)
        console.log('inserting new file', base, filename)
        this.db
            .prepare(`INSERT OR REPLACE INTO ${base} (filename, timestamp, duration, extinf) VALUES (@filename, @timestamp, @duration, @extinf)`)
            .run(segment)
    }

    remove(base, filename) {
        this.db
            .prepare(`DELETE FROM ${base} WHERE filename = ?`)
            .run([filename])
    }

    removeBulk(base, filenames, len = 3 * 24 * 3600) {
        this.createTable(base)
        console.log('received files', filenames.length)
        let i = 0, n = filenames.length
        while (i < n) {
            console.log(`deleting batch ${Math.ceil((i+1) / len)} of ${Math.ceil(n / len)}`)

            console.time('- batch processing')
            const list = filenames.slice(i, i += len).map(({ filename }) => `'${filename}'`)
            console.timeEnd('- batch processing')
            
            console.time('- remove batch processing')
            this.db.prepare(`DELETE FROM ${base} WHERE filename IN (${list.join(', ')})`).run()
            console.timeEnd('- remove batch processing')
        }
    }

    tooOld(base, maxAge) {
        return this.db
            .prepare(`SELECT filename FROM ${base} WHERE timestamp < ?`)
            .all([(Date.now() / 1000) - maxAge])
    }

    seek(base, from, to) {
        return this.db
            .prepare(`SELECT * FROM ${base} WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp ASC`)
            .all([from, to])
        
    }

    shift(base, shift = 0, limit = 5) {
        return this.db
            .prepare(`SELECT * FROM ${base} WHERE timestamp >= ? ORDER BY timestamp ASC LIMIT ${limit}`)
            .all([(Date.now() / 1000) - shift])
    }
}
