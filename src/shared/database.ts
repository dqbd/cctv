import { PrismaClient } from "@prisma/client"

import fsPath from "path"
import { createSegment } from "shared/segment"

export class Database {
  prisma = new PrismaClient()

  async resetFolder(cameraKey: string) {
    this.prisma.scene.deleteMany({
      where: { camera: cameraKey },
    })
  }

  async insertFolder(
    camera: string,
    keyBase: string,
    filenames: string[],
    len = 3 * 24 * 3600
  ) {
    let i = 0
    const n = filenames.length

    while (i < n) {
      const slices = filenames.slice(i, (i += len))

      const queries = slices.reduce<[Date, string][]>((memo, filename) => {
        const segment = createSegment(filename)
        const target = fsPath.join(keyBase, fsPath.basename(filename))
        if (!segment) return memo

        memo.push([segment.timestamp, target])
        return memo
      }, [])

      await this.prisma.$transaction(
        queries.map(([timestamp, path]) => {
          return this.prisma.scene.create({
            data: { camera, path, timestamp },
          })
        })
      )
    }
  }

  async insert(camera: string, path: string) {
    const segment = createSegment(fsPath.basename(path))
    if (!segment || segment.duration <= 0) return null

    await this.prisma.scene.upsert({
      where: { camera_timestamp: { camera, timestamp: segment.timestamp } },
      create: { camera, path, timestamp: segment.timestamp },
      update: { path },
    })
  }

  async seek(camera: string, fromSec: number, toSec: number) {
    const from = new Date(fromSec * 1000)
    const to = new Date(toSec * 1000)

    return this.prisma.scene.findMany({
      where: {
        camera,
        timestamp: toSec ? { gte: from, lte: to } : { gte: from },
      },
      orderBy: { timestamp: "asc" },
    })
  }

  async seekFrom(camera: string, fromSec: number, limit = 5) {
    const from = new Date(fromSec * 1000)

    return this.prisma.scene.findMany({
      where: { camera, timestamp: { gte: from } },
      orderBy: { timestamp: "asc" },
      take: limit,
    })
  }

  async shift(camera: string, shiftSec = 0, limit = 5) {
    const shift = shiftSec * 1000
    return this.prisma.scene.findMany({
      where: {
        camera,
        timestamp: { gte: new Date(Date.now() - shift) },
      },
      orderBy: { timestamp: "asc" },
      take: limit,
    })
  }

  async removeOldScenesAndMotion(camera: string, maxAgeSec: number) {
    const maxAge = maxAgeSec * 1000

    return this.prisma.scene.deleteMany({
      where: {
        camera,
        timestamp: { lte: new Date(Date.now() - maxAge) },
      },
    })
  }
}
