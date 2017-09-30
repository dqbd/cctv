#!/bin/bash
. ./init.sh
mkdir -p $BASE/$1
ffmpeg -i $2 $FFMPEG_PARAMS -hls_segment_filename "$BASE/$1/$SEGMENT_NAME" "$BASE/$1/$MANIFEST_NAME"

# rtspToHls "VENKU" "rtsp://192.168.1.168:554/user=admin&password=&channel=1&stream=0.sdp?real_stream"
# rtspToHls "OBCHOD" "rtsp://192.168.1.164:554/user=admin&password=&channel=1&stream=0.sdp?real_stream"

gst-launch-1.0 videomixer sink_0::xpos=1280 sink_1::xpos=0 name=mixer ! multiqueue ! kmssink connector-id=65 plane-id=49 \
    uridecodebin uri="file://$BASE/VENKU/$MANIFEST_NAME" ! mixer. \
    uridecodebin uri="file://$BASE/OBCHOD/$MANIFEST_NAME" ! mixer.

# gst-launch-1.0 uridecodebin uri="file://$BASE/VENKU/$MANIFEST_NAME" ! kmssink connector-id=65 plane-id=49
# gst-launch-1.0 uridecodebin uri="file://$BASE/OBCHOD/$MANIFEST_NAME" ! kmssink connector-id=65 plane-id=49

# ls -1 | awk -F= 'BEGIN{FS="_"} { if ($1 == "sg" && $2 > 1506703300 && $3 > 1) print "EXTINF:"$3"\n"$0 }'
