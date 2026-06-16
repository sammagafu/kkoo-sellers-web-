#!/bin/sh
set -eu

: "${API_UPSTREAM:=https://api.kkooapp.co.tz}"
export API_UPSTREAM

echo "nginx: API_UPSTREAM=${API_UPSTREAM}"

envsubst '${API_UPSTREAM}' \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
