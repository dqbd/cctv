#!/bin/bash
BASE="/media/linaro/cctv"
MANIFEST_NAME="manifest.m3u8"
SEGMENT_NAME="sg_%s_%%t.ts"
FFMPEG_PARAMS="-c copy -hls_time 10 -hls_start_number_source epoch -use_localtime 1 -timeout -1 -hls_flags second_level_segment_duration"
