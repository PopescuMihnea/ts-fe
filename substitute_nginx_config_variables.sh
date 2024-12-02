#!/bin/sh
ROOT_DIR=/etc/nginx

sed -i "s|\${PORT}|${PORT:-8080}|g" "${ROOT_DIR}/nginx.conf"

exec "$@"