import { Segment, getManifest, parseManifest } from "./manifest"

describe("manifest", () => {
  it("parse manifest", () => {
    const manifest = parseManifest(`
      #EXTM3U
      #EXT-X-VERSION:3
      #EXT-X-TARGETDURATION:8
      #EXT-X-MEDIA-SEQUENCE:1655599910
      #EXTINF:8.333333,
      example/sg_1655599910_1655599910_8333333.ts
      #EXTINF:8.333333,
      example/sg_1655599918_1655599911_8333333.ts
      #EXTINF:6.033333,
      example/sg_1655599926_1655599912_6033333.ts
      #EXT-X-ENDLIST
    `)

    expect(manifest).toMatchObject({
      targetDuration: 8,
      files: [
        "example/sg_1655599910_1655599910_8333333.ts",
        "example/sg_1655599918_1655599911_8333333.ts",
        "example/sg_1655599926_1655599912_6033333.ts",
      ],
    })
  })

  it("parse segment", () => {
    const segment = Segment.parseSegment("sg_1655599910_0_8333333.ts", 8)
    expect(segment).toMatchObject({
      filename: "sg_1655599910_0_8333333.ts",
      sequence: "0",
      timestamp: "1655599910",
      duration: "8333333",
      targetDuration: 8,
    })
  })

  it("get manifest", () => {
    const segments = [
      new Segment("sg_1655599910_1655599910_8333333.ts", 10),
      new Segment("sg_1655599918_1655599911_8333333.ts", 8),
      new Segment("sg_1655599926_1655599912_8333333.ts", 8),
    ]

    const manifest = getManifest(segments)

    expect(manifest).toEqual(
      `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:8
#EXT-X-MEDIA-SEQUENCE:1655599910
#EXTINF:8.333333,
sg_1655599910_1655599910_8333333.ts
#EXTINF:8.333333,
sg_1655599918_1655599911_8333333.ts
#EXTINF:8.333333,
sg_1655599926_1655599912_8333333.ts
`
    )
  })
})

describe("ext-inf", () => {
  it("ext-inf segment", () => {
    expect(
      Segment.parseSegment("sg_1655599910_0_8333333.ts", 8)?.getExtInf()
    ).toEqual("8.333333")
  })

  it("ext-inf segment shorter", () => {
    expect(
      Segment.parseSegment("sg_1655599910_0_12.ts", 8)?.getExtInf()
    ).toEqual("0.000012")
  })

  it("ext-inf segment multi zeroes", () => {
    expect(
      Segment.parseSegment("sg_1655599910_0_000.ts", 8)?.getExtInf()
    ).toEqual("0.000000")
  })

  it("ext-inf segment equal", () => {
    expect(
      Segment.parseSegment("sg_1655599910_0_123456.ts", 8)?.getExtInf()
    ).toEqual("0.123456")
  })
})
