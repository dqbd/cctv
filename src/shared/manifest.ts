interface IManifestConfig {
  segmentSize: number
}

interface IManifestSegment {
  extinf: string
  filename: string
}

export function getManifest(
  config: IManifestConfig,
  segments: IManifestSegment[],
  seq: number,
  options?: {
    offset?: number
    end?: boolean
  }
) {
  const buffer = [
    "#EXTM3U",
    "#EXT-X-VERSION:3",
    `#EXT-X-TARGETDURATION:${config.segmentSize}`,
    `#EXT-X-MEDIA-SEQUENCE:${seq}`,
  ]

  if (options?.offset != null) {
    buffer.push(`#EXT-X-START:TIME-OFFSET=${options.offset},PRECISE=YES`)
  }

  segments.forEach(({ filename, extinf }) => {
    buffer.push(`#EXTINF:${extinf || "4.000"},`)
    buffer.push(filename)
  })

  if (options?.end) {
    buffer.push("#EXT-X-ENDLIST")
  }

  return buffer.join("\n") + "\n"
}
