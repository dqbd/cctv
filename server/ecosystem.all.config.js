const perform = require('./ecosystem.perform.config')
const servers = require('./ecosystem.servers.config')

module.exports = {
  apps: [
    ...servers.apps,
    ...perform.apps,
  ],
}