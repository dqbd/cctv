local template = import '../scripts/config.jsonnet';

local targets = {
  VENKU: {
    name: 'dummy',
    rtsp: 'rtsp://172.16.1.160:8554/dummy',
  },
  VENKU_2: {
    name: 'dummy',
    rtsp: 'rtsp://172.16.1.160:8554/dummy',
  },
};

template.generate(targets)
