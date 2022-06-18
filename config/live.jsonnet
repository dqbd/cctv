local template = import '../scripts/config.jsonnet';

template.generate({
  VENKU: {
    name: 'Venku',
    onvif: 'http://192.168.2.168:8899',
    username: 'admin',
    password: '',
  },
  STARY_VCHOD: {
    name: 'Východ',
    onvif: 'http://192.168.2.172:8899',
    username: 'admin',
    password: '',
  },
  STARY_SPODNI: {
    name: 'Pokladna',
    onvif: 'http://192.168.2.176:8899',
    username: 'admin',
    password: '',
  },
  VPREDU_VCHOD: {
    name: 'Vchod',
    onvif: 'http://192.168.2.180:8899',
    username: 'admin',
    password: '',
  },
  VZADU_KOSILE: {
    name: 'Košile',
    onvif: 'http://192.168.2.184:8899',
    username: 'admin',
    password: '',
  },
  VZADU_PROSTERADLA: {
    name: 'Prostěradla',
    onvif: 'http://192.168.2.164:8899',
    username: 'admin',
    password: '',
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
