local template = import '../scripts/config.jsonnet';

template.generate({
  VENKU: {
    name: 'dummy',
    rtsp: 'rtsp://172.16.1.160:8554/dummy',
  },
  VENKU_2: {
    name: 'dummy',
    rtsp: 'rtsp://172.16.1.160:8554/dummy',
  },
}, {
  database: {},
  storage: {
    driver: 'local',
    driver_opts: {
      type: 'none',
      device: '/media/cctv',
      o: 'bind',
    },
  },
}, {
  driver: 'loki',
  options: {
    'loki-url': 'http://127.0.0.1:3100/loki/api/v1/push',
  },
})
