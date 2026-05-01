#!/bin/sh
set -e

# Render the nginx config with the runtime-injected $PORT (default 8080).
# Cloud platforms (Cloud Run, Railway, Render…) inject $PORT dynamically.
export PORT="${PORT:-8080}"

envsubst '${PORT}' \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/sites-available/default

# Some images use conf.d, others use sites-enabled — symlink to be safe.
ln -sf /etc/nginx/sites-available/default /etc/nginx/conf.d/default.conf

# Strip the default nginx server { listen 80 } from the main config so it
# doesn't conflict with our templated server block.
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

echo "[entrypoint] nginx will listen on port $PORT, proxying /api → 127.0.0.1:8001"

exec "$@"
