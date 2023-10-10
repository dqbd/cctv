import fsPath from "path"
import { Segment } from "shared/manifest"
import knex, { Knex } from "knex"
import { GlobalRef } from "utils/global"

interface CameraTable {
  timestamp: Date
  pdt: Date | null
  duration: number
  targetDuration: number
  path: string
}

interface LogTable {
  timestamp: Date
  json: string
}

export class Database {
  private knex: Knex

  private logTime = 0

  constructor(config: Knex.Config) {
    this.knex = knex(config)
  }

  async destroy() {
    return this.knex.destroy()
  }

  async initFolder(cameraKey: string) {
    if (!(await this.knex.schema.hasTable(cameraKey))) {
      return this.knex.schema.createTable(cameraKey, (table) => {
        table.dateTime("timestamp", { precision: 3 }).primary()
        table.dateTime("pdt", { precision: 3 }).nullable()
        table.decimal("duration", 12, 6)
        table.integer("targetDuration")
        table.string("path")
      })
    }

    if (!(await this.knex.schema.hasTable(`${cameraKey}_log`))) {
      return this.knex.schema.createTable(`${cameraKey}_log`, (table) => {
        table.dateTime("timestamp", { precision: 3 }).primary()
        table.string("json")
      })
    }
  }

  async insertLog(cameraKey: string, json: string) {
    const newNow = Date.now()
    this.logTime = newNow + (newNow === this.logTime ? 1 : 0)

    return this.knex<LogTable>(`${cameraKey}_log`).insert({
      timestamp: new Date(this.logTime),
      json,
    })
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
    const inferTargetDuration = Math.floor(
      filenames
        .map((i) => Segment.parseSegment(i, -1, null)?.getExtInf())
        .filter((i): i is string => i != null)
        .map((i) => Number.parseFloat(i))
        .filter((i) => !Number.isNaN(i))
        .reduce((min, i) => Math.min(min, i), Infinity)
    )

    const segments = filenames.reduce<CameraTable[]>((memo, filename) => {
      const segment = Segment.parseSegment(filename, inferTargetDuration, null)
      const target = fsPath.join(keyBase, fsPath.basename(filename))
      if (!segment) return memo

      memo.push({
        timestamp: segment.getDate(),
        pdt: segment.pdt,
        targetDuration: segment.targetDuration,
        duration: Number.parseFloat(segment.getExtInf()),
        path: target,
      })
      return memo
    }, [])

    return this.knex.batchInsert<CameraTable>(camera, segments, chunkSize)
  }

  async insert(
    camera: string,
    targetDuration: number,
    path: string,
    pdt: string | null
  ) {
    const segment = Segment.parseSegment(
      fsPath.basename(path),
      targetDuration,
      pdt ? new Date(Date.parse(pdt)) : null
    )

    if (!segment) return null

    return this.knex<CameraTable>(camera)
      .insert({
        timestamp: segment.getDate(),
        pdt: segment.pdt,
        targetDuration,
        duration: Number.parseFloat(segment.getExtInf()),
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

  async logRange(camera: string, fromSec: number, toSec: number) {
    const from = new Date(fromSec * 1000)
    const to = new Date(toSec * 1000)

    return this.knex
      .select("*")
      .from<LogTable>(`${camera}_log`)
      .whereBetween("timestamp", [from, to])
      .orderBy("timestamp", "asc")
  }

  async seekFrom(
    camera: string,
    fromSec: number,
    limit = 5
  ): Promise<CameraTable[]> {
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

    await this.knex<CameraTable>(camera)
      .where("timestamp", "<=", new Date(Date.now() - maxAge))
      .delete()

    await this.knex<LogTable>(`${camera}_log`)
      .where("timestamp", "<=", new Date(Date.now() - maxAge))
      .delete()
  }
}

export function createPersistentDatabase() {
  const dbRef = new GlobalRef<Database | null>("database")

  if (dbRef.value != null) {
    dbRef.value.destroy()
    dbRef.value = null
  }

  return {
    create(config: Knex.Config) {
      if (dbRef.value != null) return dbRef.value
      return (dbRef.value = new Database(config))
    },
  }
}
