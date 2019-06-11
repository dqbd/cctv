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
      name: "sync",
      script: "./bin/sync.js",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
}
