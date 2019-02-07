const config = require('./config.js')

module.exports = {
  apps: [
    {
      name: "hackycctv",
      script: "./bin/serve.js",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
    {
      name: "cleanup",
      script: "./bin/cleanup.js",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
    {
      name: "proxy",
      script: "./bin/proxy.js",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
    ...Object.keys(config.targets).map((name) => ({
      name: `perform:${name}`,
      script: `./bin/perform.js ${name}`,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    })),
  ],
}