const { Database } = require('sqlite3')
const { createSegment } = require('./segment')

module.exports = class Cache {
    constructor(path) {
        this.db = new Database(path)
        this.hasCreated = {}
    }

    createTable(base) {
        return new Promise((resolve, reject) => {
            if (this.hasCreated[base]) return resolve()
            this.db.prepare(`
                CREATE TABLE IF NOT EXISTS ${base} (
                    timestamp int(12) NOT NULL,
                    filename varchar(180) NOT NULL,
                    extinf varchar(100) NOT NULL,
                    duration int(10) NOT NULL,
                    PRIMARY KEY (timestamp)
                )`
            ).run((err) => {
                if (err) return reject(err)
                this.hasCreated[base] = true
                resolve()
            })
        })
    }

    insertBulk(base, filenames, len = 3 * 24 * 3600) {
        return this.createTable(base)
            .then(() => {
                let i = 0, n = filenames.length
                let promises = []
                while (i < n) {
                    const transactions = filenames.slice(i, i += len).forEach((filename) => {
                        const segment = createSegment(filename)
                        if (!segment) return
                        promises.push(new Promise((resolve, reject) => {
                            this.db.run(`INSERT OR REPLACE INTO ${base} (filename, timestamp, duration, extinf) VALUES ('${segment.filename}', '${segment.timestamp}', '${segment.duration}', '${segment.extinf}')`, (err) => {
                                if (err) return reject(err)
                                resolve()
                            })
                        }))
                    }, [])
                }

                return Promise.all(promises)
            })
    }

    insert(base, filename) {
        const segment = createSegment(filename)
        if (!segment || segment.duration <= 0) return Promise.reject()
        return this.createTable(base).then(() => {
            this.db
                .prepare(`INSERT OR REPLACE INTO ${base} (filename, timestamp, duration, extinf) VALUES (@filename, @timestamp, @duration, @extinf)`)
                .run(segment, (err) => {
                    if (err) return reject(err)
                    resolve()
                })
        })
    }

    remove(base, filename) {
        return new Promise((resolve, reject) => {
            this.db
                .prepare(`DELETE FROM ${base} WHERE filename = ?`)
                .run([filename], (err) => {
                    if (err) return reject(err)
                    resolve()
                })
        })
    }

    removeBulk(base, filenames, len = 3 * 24 * 3600) {
        return this.createTable(base).then(() => {
            let i = 0, n = filenames.length
            let promises = []
            while (i < n) {
                const list = filenames.slice(i, i += len).map(({ filename }) => `'${filename}'`)
                promises.push(new Promise((resolve, reject) => {
                    this.db.prepare(`DELETE FROM ${base} WHERE filename IN (${list.join(', ')})`).run((err) => {
                        if (err) return reject(err)
                        resolve()
                    })
                }))
            }

            return Promise.all(promises)
        })
    }
        

    tooOld(base, maxAge) {
        return new Promise((resolve, reject) => {
            this.db
                .prepare(`SELECT filename FROM ${base} WHERE timestamp < ?`)
                .all([(Date.now() / 1000) - maxAge], (err, rows) => {
                    if (err) return reject(err)
                    resolve(rows)
                })
        })
    }

    seek(base, from, to) {
        return new Promise((resolve, reject) => {
            return this.db
                .prepare(`SELECT * FROM ${base} WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp DESC`)
                .all([from, to], (err, rows) => {
                    if (err) return reject(err)
                    resolve(rows)
                })
            
        })
    }

    shift(base, shift = 0, limit = 5) {
        return new Promise((resolve, reject) => {
            return this.db
                .prepare(`SELECT * FROM ${base} WHERE timestamp >= ? ORDER BY timestamp DESC LIMIT ${limit}`)
                .all([(Date.now() / 1000) - shift], (err, rows) => {
                    if (err) return reject(err)
                    resolve(rows)
                })
        })
    }
}