#!/bin/sh
if ! node ./.next/server/init.js; then
  exit 1
fi

exec "$@"
