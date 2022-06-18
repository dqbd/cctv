local mysql = {
  host: 'db',
  port: 3306,
  user: 'cctv',
  password: 'mysql',
  rootPassword: 'mysql',
  database: 'cctv',
};

{
  generate(targets, volumes={
    database: {},
    storage: {},
  }, logging={})::
    local config = {
      base: '/cctv/storage',
      manifest: 'manifest.m3u8',
      maxAge: 604800,
      syncInterval: 3600,
      cleanupPolling: 60,
      segmentSize: 3,
      targets: targets,
    };

    local cctv = {
      // build: '.',
      // image: "cctv",
      image: 'ghcr.io/dqbd/cctv:master',
      restart: 'unless-stopped',
      logging: logging,
      environment: {
        TZ: 'Europe/Prague',
        CONFIG_BASE64: std.base64(std.manifestJsonMinified(config)),
        MYSQL_HOST: mysql.host,
        MYSQL_PORT: mysql.port,
        MYSQL_USER: mysql.user,
        MYSQL_PASSWORD: mysql.password,
        MYSQL_DATABASE: mysql.database,
      },
      volumes: [
        'storage:/cctv/storage',
      ],
    };

    {
      'config.json': std.manifestJsonMinified(config),
      'docker-compose.yml': std.manifestYamlDoc({
        version: '3.9',
        services: {
          sync: cctv { command: ['yarn', 'start:sync'], ports: [9229] },
          server: cctv { command: ['yarn', 'start'], ports: [9229, '3000:3000'] },
          db: {
            restart: 'unless-stopped',
            image: 'linuxserver/mariadb',
            environment: {
              PUID: 1000,
              PGID: 1000,
              TZ: cctv.environment.TZ,
              MYSQL_ROOT_PASSWORD: mysql.rootPassword,
              MYSQL_USER: mysql.user,
              MYSQL_DATABASE: mysql.database,
              MYSQL_PASSWORD: mysql.password,
            },
            ports: [
              mysql.port + ':' + mysql.port,
            ],
            volumes: [
              'database:/config',
            ],
          },
        } + std.foldl(function(result, name) result {
          [name]: cctv { command: ['yarn', 'start:worker', name], ports: [9229] },
        }, std.objectFields(targets), {}),
        volumes: {
          database: volumes.database,
          storage: volumes.storage,
        },
      }),
    },
}
