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
            const targets = ["src/server"]

            let workerEntries = {}
            for (const target of targets) {
              const targetDir = path.resolve(cwd, target)
              const workers = await fs.promises.readdir(targetDir)

              workerEntries = {
                ...workerEntries,
                ...Object.fromEntries(
                  workers
                    .filter((filename) => filename.includes(".ts"))
                    .map((filename) => [
                      filename.split(".").shift(),
                      path.resolve(targetDir, filename),
                    ])
                ),
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
