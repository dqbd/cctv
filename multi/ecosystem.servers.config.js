module.exports = {
  apps: [
    {
      name: "hackycctv",
      script: "./.next/server/serve.js",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
    {
      name: "sync",
      script: "./.next/server/sync.js",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
}
