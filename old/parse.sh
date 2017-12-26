#!/bin/bash
. ./init.sh
mkdir -p $BASE/$1
ffmpeg -i $2 $FFMPEG_PARAMS -hls_segment_filename "$BASE/$1/$SEGMENT_NAME" "$BASE/$1/$MANIFEST_NAME"
