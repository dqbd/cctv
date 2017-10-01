#!/bin/bash
BASE="/media/linaro/cctv"
MANIFEST_NAME="manifest.m3u8"
SEGMENT_NAME="sg_%s_%%t.ts"
SEGMENT_SIZE="2"
FFMPEG_PARAMS="-c copy -hls_time $SEGMENT_SIZE -hls_start_number_source epoch -use_localtime 1 -timeout -1 -hls_flags second_level_segment_duration"
