module.exports = {
  apps: [
    {
      name: "hackycctv",
      script: "yarn start -p 80",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
    {
      name: "sync",
      script: "./.next/server/sync.js",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
}
