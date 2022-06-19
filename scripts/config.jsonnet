{
  generate(targets, overrides={})::
    local mysql = {
      host: 'db',
      port: 3306,
      user: 'cctv',
      password: 'mysql',
      rootPassword: 'mysql',
      database: 'cctv',
    } + std.get(overrides, 'mysql', {});

    local config = {
      maxAge: 7 * 24 * 60 * 60,  // in seconds
      cleanupPolling: 60,  // in seconds
      targets: targets,
    } + std.get(overrides, 'config', {});

    local cctv = {
      image: 'ghcr.io/dqbd/cctv:master',
      restart: 'unless-stopped',
      environment: {
        TZ: 'Europe/Prague',
        CONFIG_BASE64: std.base64(std.encodeUTF8(std.manifestJsonMinified(config))),
        CCTV_BASE_FOLDER: '/cctv/storage',
        MYSQL_HOST: mysql.host,
        MYSQL_PORT: mysql.port,
        MYSQL_USER: mysql.user,
        MYSQL_PASSWORD: mysql.password,
        MYSQL_DATABASE: mysql.database,
      },
      volumes: [
        'storage:/cctv/storage',
      ],
    } + std.get(overrides, 'cctv', {});

    local workers = std.foldl(function(result, name) result {
      [name]: cctv { command: ['yarn', 'start:worker', name], ports: [9229] },
    }, std.objectFields(targets), {});

    {
      'config.json': std.manifestJsonMinified(config),
      'docker-compose.yml': std.manifestYamlDoc({
        version: '3.9',
        services: workers {
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
        },
        volumes: {
          database: std.get(std.get(overrides, 'volumes', {}), 'database', {}),
          storage: std.get(std.get(overrides, 'volumes', {}), 'storage', {}),
        },
      }),
    },
}
