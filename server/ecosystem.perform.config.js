const config = require("./config.js")

module.exports = {
  apps: [
    ...Object.keys(config.targets).map((name) => ({
      name: `perform:${name}`,
      script: `./dist/bin/perform.js`,
      args: `${name}`,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    })),
  ],
}
