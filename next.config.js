const path = require("path")
const fs = require("fs")

const cwd = process.cwd()

module.exports = {
  future: {
    webpack5: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback.fs = false
    }

    if (isServer) {
      return {
        ...config,
        entry() {
          return config.entry().then(async (entry) => {
            const targets = ["src/workers", "src/scripts"]

            let workerEntries = {}
            for (const target of targets) {
              const targetDir = path.resolve(cwd, target)
              const workers = await fs.promises.readdir(targetDir)

              workerEntries = {
                ...workerEntries,
                ...workers.reduce((memo, filename) => {
                  if (!filename.includes(".ts")) return memo
                  const name = filename.split(".").shift()
                  memo[name] = path.resolve(targetDir, filename)
                  return memo
                }, {}),
              }
            }

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
