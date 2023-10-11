local template = import '../scripts/config.jsonnet';

template.generate({
  VENKU: {
    name: 'Venku',
    source: 'onvif://admin:@192.168.2.168:8899',
  },
  STARY_VCHOD: {
    name: 'Východ',
    source: 'onvif://admin:@192.168.2.172:8899',
  },
  STARY_SPODNI: {
    name: 'Pokladna',
    source: 'onvif://admin:@192.168.2.176:8899',
  },
  VPREDU_VCHOD: {
    name: 'Vchod',
    source: 'onvif://admin:@192.168.2.180:8899',
  },
  VZADU_KOSILE: {
    name: 'Košile',
    source: 'onvif://admin:@192.168.2.184:8899',
  },
  VZADU_PROSTERADLA: {
    name: 'Prostěradla',
    source: 'onvif://admin:@192.168.2.164:8899',
  },
  POKLADNA: {
    name: 'Peněženky',
    source: 'rtsp://cctv:XAR4bwc.ukz6wax3tkd@192.168.2.198:554/h264Preview_01_main'
  }
}, {
  volumes: {
    storage: {
      driver: 'local',
      driver_opts: {
        type: 'none',
        device: '/media/cctv',
        o: 'bind',
      },
    },
  },
  cctv: {
    logging: {
      driver: 'loki',
      options: {
        'loki-url': 'http://127.0.0.1:3100/loki/api/v1/push',
      },
    },
  },
})
