#!/bin/bash
. ./init.sh
systemctl stop lightdm
gst-launch-1.0 videomixer sink_0::xpos=1280 sink_1::xpos=0 name=mixer ! multiqueue ! kmssink connector-id=65 plane-id=49 \
	uridecodebin uri="file://$BASE/VENKU/$MANIFEST_NAME" ! mixer. \
	uridecodebin uri="file://$BASE/OBCHOD/$MANIFEST_NAME" ! mixer.
