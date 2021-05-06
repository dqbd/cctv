module.exports = {
  apps: [
    {
      name: "hackycctv",
      script: "./dist/bin/serve.js",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
    {
      name: "sync",
      script: "./dist/bin/sync.js",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
}
