local template = import '../scripts/config.jsonnet';

template.generate({
  VENKU: {
    name: 'dummy',
    source: 'rtsp://172.16.1.160:8554/dummy',
  },
  VEVNITR: {
    name: 'dummy',
    source: 'rtsp://172.16.1.160:8554/dummy',
  },
}, {
  cctv: { build: '.' },
})
