const path = require('path')
const mysql = require('promise-mysql')

const { createSegment } = require('./segment')

module.exports = class Database {
  constructor(config) {
    this.conn = null
    this.config = config
    this.hasCreated = {}
  }

  getScenesTable(cameraKey) {
    return `${cameraKey}_SCENES`
  }

  getMotionTable(cameraKey) {
    return `${cameraKey}_MOTION` 
  }

  async init() {
    if (!this.conn) {
      this.conn = await mysql.createConnection(this.config)
    }
  }

  async close() {
    if (this.conn) {
      this.conn.end()
    }
  }

  async createTable(base) {
    await this.init()
    if (this.hasCreated[base]) return

    await this.conn.query(`
      CREATE TABLE IF NOT EXISTS ?? (
        timestamp BIGINT NOT NULL,
        path varchar(180) NOT NULL,
        PRIMARY KEY (timestamp)
      )
      ENGINE = MyISAM
    `, [this.getScenesTable(base)])
    await this.conn.query(`
      CREATE TABLE IF NOT EXISTS ?? (
        timestamp BIGINT NOT NULL,
        scene NUMERIC(12, 10) NOT NULL,
        PRIMARY KEY (timestamp)
      )
      ENGINE = MyISAM
    `, [this.getMotionTable(base)])

    this.hasCreated[base] = true
  }

  async resetFolder(cameraKey) {
    await this.createTable(cameraKey)
    return Promise.all([
      this.conn.query('TRUNCATE TABLE ??', [this.getScenesTable(cameraKey)]),
      this.conn.query('TRUNCATE TABLE ??', [this.getMotionTable(cameraKey)]),
    ])
  }

  async insertFolder(cameraKey, keyBase, filenames, len = 3 * 24 * 3600) {
    await this.createTable(cameraKey)

    console.log('Insert', cameraKey, keyBase, filenames.length)

    let i = 0, n = filenames.length
    while (i < n) {
      const slices = filenames.slice(i, i += len)
      const queries = slices.reduce((memo, filename) => {
        const segment = createSegment(filename)
        const target = path.join(keyBase, path.basename(filename))
        if (!segment) return memo

        memo.push([segment.timestamp, target])
        return memo
      }, [])

      await this.conn.query(`INSERT INTO ?? (timestamp, path) VALUES ? ON DUPLICATE KEY UPDATE path = path`, [this.getScenesTable(cameraKey), queries])
    }
  }

  async insert(cameraKey, relative) {
    console.log('Insert', cameraKey, relative)
    await this.createTable(cameraKey)

    const segment = createSegment(path.basename(relative))
    if (!segment || segment.duration <= 0) return null

    return this.conn.query(`
      INSERT INTO ?? (path, timestamp)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE path = ?
    `, [this.getScenesTable(cameraKey), relative, segment.timestamp, relative])
  }

  async seek(cameraKey, from, to, limit = 5) {
    await this.createTable(cameraKey)

    if (!to) {
      return this.conn
        .query(`
          SELECT * FROM ??
          WHERE timestamp >= ?
          ORDER BY timestamp ASC
        `, [this.getScenesTable(cameraKey), from])
    }

    return this.conn
      .query(`
        SELECT * FROM ??
        WHERE timestamp >= ? AND timestamp <= ?
        ORDER BY timestamp ASC
      `, [this.getScenesTable(cameraKey), from, to])
  }

  async seekFrom(cameraKey, from, limit = 5) {
    await this.createTable(cameraKey)

    return this.conn
      .query(`
        SELECT * FROM ??
        WHERE timestamp >= ?
        ORDER BY timestamp ASC
        LIMIT ?
      `, [this.getScenesTable(cameraKey), from, limit])
  }

  async shift(cameraKey, shift = 0, limit = 5) {
    await this.createTable(cameraKey)
    return this.conn
      .query(`
        SELECT * FROM ??
        WHERE timestamp >= ?
        ORDER BY timestamp ASC
        LIMIT ?
      `, [this.getScenesTable(cameraKey), Math.floor(Date.now() / 1000) - shift, limit])
  }

  async removeOldScenesAndMotion(cameraKey, maxAge) {
    await this.createTable(cameraKey)
    const timestamp = Math.floor(Date.now() / 1000) - maxAge

    return Promise.all([
      this.conn
        .query(`
          DELETE FROM ??
          WHERE timestamp <= ?
        `, [this.getScenesTable(cameraKey), timestamp]),
      this.conn
        .query(`
          DELETE FROM ??
          WHERE timestamp <= ?
        `, [this.getMotionTable(cameraKey), timestamp])
    ])
  }

  async getScenes(cameraKey) {
    await this.createTable(cameraKey)
    return this.conn
      .query(`
        SELECT * FROM ??
        ORDER BY timestamp DESC
      `, [this.getMotionTable(cameraKey)])
  }

  async addScene(cameraKey, value) {
    await this.createTable(cameraKey)
    return this.conn
      .query(`
          INSERT INTO ?? (timestamp, scene)
          VALUES (?, ?)
      `, [this.getMotionTable(cameraKey), Date.now(), value])
  }
}
