local template = import '../scripts/config.jsonnet';

template.generate({
  VENKU: {
    name: 'dummy',
    rtsp: 'rtsp://172.16.1.160:8554/dummy',
  },
  VEVNITR: {
    name: 'dummy',
    rtsp: 'rtsp://172.16.1.160:8554/dummy',
  },
}, {
  cctv: { build: '.' },
})
