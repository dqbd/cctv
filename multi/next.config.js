const path = require("path")
const fs = require("fs")

const cwd = process.cwd()

module.exports = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      return {
        ...config,
        entry() {
          return config.entry().then(async (entry) => {
            const contents = await fs.promises.readdir(
              path.resolve(cwd, "src/workers")
            )

            const workerEntries = contents.reduce((memo, filename) => {
              if (!filename.includes(".ts")) return memo
              const name = filename.split(".").shift()
              memo[name] = path.resolve(cwd, "src/workers", filename)
              return memo
            }, {})

            console.log(workerEntries)

            return {
              ...entry,
              ...workerEntries,
            }
          })
        },
      }
    }

    return config
  },
}
