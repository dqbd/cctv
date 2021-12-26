import fsPath from "path"
import { createSegment } from "shared/segment"

import knex, { Knex } from "knex"

interface CameraTable {
  timestamp: Date
  path: string
}

export class Database {
  private knex: Knex

  constructor(config: Knex.Config) {
    this.knex = knex(config)
  }

  async destroy() {
    return this.knex.destroy()
  }

  async initFolder(cameraKey: string) {
    if (!(await this.knex.schema.hasTable(cameraKey))) {
      return this.knex.schema.createTableIfNotExists(cameraKey, (table) => {
        table.dateTime("timestamp").primary()
        table.string("path")
      })
    }
  }

  async resetFolder(cameraKey: string) {
    return this.knex<CameraTable>(cameraKey).truncate()
  }

  async insertFolder(
    camera: string,
    keyBase: string,
    filenames: string[],
    chunkSize = 256
  ) {
    const segments = filenames.reduce<{ timestamp: Date; path: string }[]>(
      (memo, filename) => {
        const segment = createSegment(filename)
        const target = fsPath.join(keyBase, fsPath.basename(filename))
        if (!segment) return memo

        memo.push({
          timestamp: segment.timestamp,
          path: target,
        })
        return memo
      },
      []
    )

    return this.knex.batchInsert<CameraTable>(camera, segments, chunkSize)
  }

  async insert(camera: string, path: string) {
    const segment = createSegment(fsPath.basename(path))
    if (!segment || segment.duration <= 0) return null

    return this.knex<CameraTable>(camera)
      .insert({
        timestamp: segment.timestamp,
        path,
      })
      .onConflict("timestamp")
      .merge()
  }

  async seek(camera: string, fromSec: number, toSec: number) {
    const from = new Date(fromSec * 1000)
    const to = new Date(toSec * 1000)

    return this.knex<CameraTable>(camera)
      .where((where) => {
        return toSec
          ? where.whereBetween("timestamp", [from, to])
          : where.where("timestamp", ">=", from)
      })
      .orderBy("timestamp", "asc")
      .select()
  }

  async seekFrom(camera: string, fromSec: number, limit = 5) {
    const from = new Date(fromSec * 1000)

    return this.knex
      .with(
        "inclusive",
        this.knex
          .select("*")
          .from<CameraTable>(camera)
          .where("timestamp", "<=", from)
          .orderBy("timestamp", "desc")
          .limit(1)
      )
      .with(
        "remaining",
        this.knex
          .select("*")
          .from<CameraTable>(camera)
          .where("timestamp", ">", from)
          .orderBy("timestamp", "asc")
          .limit(limit - 1)
      )
      .select("*")
      .from("inclusive")
      .union(function () {
        this.select("*").from("remaining")
      })
      .orderBy("timestamp", "asc")
  }

  async remove(camera: string, maxAgeSec: number) {
    const maxAge = maxAgeSec * 1000

    return this.knex<CameraTable>(camera)
      .where("timestamp", "<=", new Date(Date.now() - maxAge))
      .delete()
  }
}
