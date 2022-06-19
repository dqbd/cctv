import { convertToXaddr } from "./onvif"

describe("onvif", () => {
  it("parse onvif", () => {
    expect(convertToXaddr("onvif://admin:@127.0.0.1:3000")).toMatchObject({
      xaddr: "http://127.0.0.1:3000",
      hostname: "127.0.0.1",
      username: "admin",
      password: "",
    })
  })

  it("parse other", () => {
    expect(convertToXaddr("rtsp://admin:@127.0.0.1:3000")).toBe(null)
  })
})
