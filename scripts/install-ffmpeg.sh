#!/bin/sh
AARCH=$(uname -m)
if [ $AARCH == "aarch64" ]; then
  AARCH="arm64"
fi

FILE="ffmpeg-5.0.1-$AARCH-static"
echo $FILE
wget "https://johnvansickle.com/ffmpeg/releases/$FILE.tar.xz"
tar xvf "$FILE.tar.xz"
cp "$FILE/ffmpeg" /usr/bin
