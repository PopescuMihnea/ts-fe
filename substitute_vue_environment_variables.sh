#!/bin/sh
ROOT_DIR=/app
# Replace env vars in files served by NGINX
for file in $ROOT_DIR/js/*.js* $ROOT_DIR/index.html $ROOT_DIR/precache-manifest*.js;
do
  sed -i "s|PORT_PLACEHOLDER|${PORT:-8080}|g" "$file"
  sed -i "s|VUE_APP_AI_API_URLS_PLACEHOLDER|${AI_API_URLS:?ai api urls must be present in environment}|g" "$file"
  sed -i "s|VUE_APP_AI_API_NAMES_PLACEHOLDER|${AI_API_NAMES:?ai api names must be present in environment}|g" "$file"
done

exec "$@"