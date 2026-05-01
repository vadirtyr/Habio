# =========================================================================
# Habio — single-image Dockerfile (frontend + backend in one container)
# Suitable for Railway, Render, Fly.io, Cloud Run, Heroku container deploys.
# Brings up nginx (port $PORT) which serves the React build and reverse-
# proxies /api/* to a uvicorn worker on 127.0.0.1:8001.
# Mongo is NOT included — set MONGO_URL to your managed instance (Atlas etc).
# =========================================================================

# ---------- Stage 1: build the React frontend ----------
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend

COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install --frozen-lockfile

COPY frontend/ ./

# When deployed as a single image, frontend & backend share the same origin,
# so REACT_APP_BACKEND_URL is the empty string (calls hit /api on the same host).
ARG REACT_APP_BACKEND_URL=""
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL
ENV CI=false
ENV ENABLE_HEALTH_CHECK=false

RUN yarn build


# ---------- Stage 2: runtime (Python + nginx + supervisor) ----------
FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    supervisor \
    gettext-base \
    build-essential \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Backend dependencies
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Backend source
COPY backend/ /app/backend/

# Built frontend
COPY --from=frontend-builder /frontend/build /var/www/html

# nginx + supervisor configs + entrypoint
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY supervisord.conf /etc/supervisord.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
