#!/bin/sh
set -e
node ./.next/server/init.js
exec "$@"
