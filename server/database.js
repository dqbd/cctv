const Database = require('better-sqlite3')
const path = require('path')

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
                extinf varchar(100) NOT NULL,
                duration int(10) NOT NULL,
                path varchar(180) NOT NULL,
                PRIMARY KEY (timestamp)
            )`
        ).run()

        this.db.prepare(`
            CREATE TABLE IF NOT EXISTS ${base}_SCENE (
                timestamp int(12) NOT NULL,
                scene REAL NOT NULL,
                PRIMARY KEY (timestamp)
            )
        `).run()
        this.hasCreated[base] = true
    }

    insertFolder(cameraKey, [keyBase, filenames], len = 3 * 24 * 3600) {
        this.createTable(cameraKey)
        let i = 0, n = filenames.length
        while (i < n) {
            const slices = filenames.slice(i, i += len)
            const queries = slices.reduce((memo, filename) => {
                const segment = createSegment(filename)
                const target = path.join(keyBase, filename)
                if (!segment) return memo

                memo.push(`
                    INSERT OR REPLACE INTO ${cameraKey} (path, timestamp, duration, extinf)
                    VALUES ('${target}', '${segment.timestamp}', '${segment.duration}', '${segment.extinf}')
                `)
                return memo
            }, [])

            this.db.transaction(queries).run()
        }
    }

    insertBulk(base, filenames, len = 3 * 24 * 3600) {
        this.createTable(base)
        let i = 0, n = filenames.length
        while (i < n) {
            const transactions = filenames.slice(i, i += len).reduce((memo, filename) => {
                const segment = createSegment(filename)
                if (!segment) return memo
                memo.push(`INSERT OR REPLACE INTO ${base} (filename, timestamp, duration, extinf) VALUES ('${segment.filename}', '${segment.timestamp}', '${segment.duration}', '${segment.extinf}')`)
                return memo
            }, [])
            this.db.transaction(transactions).run()
        }
    }

    insert(base, relative) {
        
        const segment = createSegment(path.basename(relative))
        if (!segment || segment.duration <= 0) return null
        this.createTable(base)
        this.db
            .prepare(`
                INSERT OR REPLACE INTO ${base} (path, timestamp, duration, extinf)
                VALUES (@path, @timestamp, @duration, @extinf)
            `)
            .run(Object.assign({}, segment, { path: relative }))
    }

    remove(base, filename) {
        this.db
            .prepare(`DELETE FROM ${base} WHERE path = ?`)
            .run([filename])
    }

    removeBulk(base, filenames, len = 3 * 24 * 3600) {
        this.createTable(base)
        let i = 0, n = filenames.length
        while (i < n) {
            const list = filenames.slice(i, i += len).map(({ filename }) => `'${filename}'`)
            this.db.prepare(`DELETE FROM ${base} WHERE filename IN (${list.join(', ')})`).run()
        }
    }

    tooOld(base, maxAge) {
        return this.db
            .prepare(`SELECT filename FROM ${base} WHERE timestamp < ?`)
            .all([(Date.now() / 1000) - maxAge])
    }

    seek(base, from, to, limit = 5) {
        if (!to) {
            return this.db
                .prepare(`SELECT * FROM ${base} WHERE timestamp >= ? ORDER BY timestamp ASC`)
                .all([from])
        }

        return this.db
            .prepare(`SELECT * FROM ${base} WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp ASC`)
            .all([from, to])
    }

    seekFrom(base, from, limit = 5) {
        return this.db
            .prepare(`SELECT * FROM ${base} WHERE timestamp >= ? ORDER BY timestamp ASC LIMIT ${limit}`)
            .all([from])
    }

    shift(base, shift = 0, limit = 5) {
        return this.db
            .prepare(`SELECT * FROM ${base} WHERE timestamp >= ? ORDER BY timestamp ASC LIMIT ${limit}`)
            .all([(Date.now() / 1000) - shift])
    }

    getScenes(base) {
        this.createTable(base)
        return this.db
            .prepare(`SELECT * FROM ${base}_SCENE ORDER BY timestamp DESC`)
            .all()
    }

    removeOldScenes(base, maxAge) {
        this.createTable(base)
        return this.db
            .prepare(`DELETE FROM ${base}_SCENE WHERE timestamp <= ?`)
            .run([Math.floor(Date.now() / 1000) - maxAge])
    }

    addScene(base, value) {
        this.createTable(base)
        return this.db
            .prepare(`
                INSERT OR REPLACE INTO ${base}_SCENE (timestamp, scene)
                VALUES (@timestamp, @scene)
            `)
            .run({ timestamp: Math.floor(Date.now() / 1000), scene: value })
    }
}
