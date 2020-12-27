const fetch = require("node-fetch")

let cache = null

module.exports = {
  getForwards: async ({ username, password, link }) => {
    if (cache) return cache

    const auth = Buffer.from(`${username}:${password}`).toString("base64")
    const data = await fetch(link, {
      headers: {
        Authorization: "Basic " + auth,
      },
    }).then((a) => a.text())

    const parse = /'portforward'\s*:\s*'(.*)'/gm
    cache = parse
      .exec(data)[1]
      .split(">")
      .filter((a) => a && a.trim())
      .map((a) => {
        const [_, __, ext, int, addr, desc] = a
          .split("<")
          .filter((a) => a && a.trim())

        if (int === "554") {
          return { ext, addr }
        }

        return null
      })
      .filter((a) => a)

    return cache
  },
}
