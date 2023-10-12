export const wrapUrl = (url: string) => {
  if (process.env.NODE_ENV === "development") {
    let pathname = url
    try {
      pathname = new URL(url).pathname
    } catch {}

    return new URL(pathname, "http://192.168.2.152:3000").toString()
  }

  return url
}
