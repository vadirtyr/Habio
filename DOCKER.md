# Running Habio with Docker

This repo ships with a complete Docker setup: a FastAPI backend, a React
frontend served by nginx, and a MongoDB instance — wired together with
docker-compose.

## Prerequisites
- Docker 20+ and Docker Compose v2

## Quick start

```bash
# 1. From the repo root, copy the env template
cp .env.example .env

# 2. Generate a JWT secret and paste it into .env
openssl rand -hex 32

# 3. Build & launch
docker compose up --build -d

# 4. Visit the app
open http://localhost:3000
```

The first build takes a few minutes (yarn install + react build). After
that, subsequent `up` commands are fast thanks to Docker layer caching.

## Service map
| Service  | Port | Description                          |
|----------|------|--------------------------------------|
| frontend | 3000 | React app served by nginx            |
| backend  | 8001 | FastAPI (uvicorn)                    |
| mongodb  | 27017| MongoDB 7 with persisted volume      |

## Common commands

```bash
docker compose logs -f backend     # tail backend logs
docker compose logs -f frontend    # tail nginx access/error logs
docker compose restart backend     # restart only backend
docker compose down                # stop everything (data persists)
docker compose down -v             # stop AND wipe Mongo data
```

## Production notes

1. **REACT_APP_BACKEND_URL** is baked at build time. If you change it,
   rebuild the frontend image: `docker compose build frontend`.
2. Put a reverse proxy (Caddy / Traefik / Nginx) in front of the backend
   for HTTPS, and update `CORS_ORIGINS` to your real frontend origin.
3. For managed Mongo (Atlas etc.), drop the `mongodb` service from
   `docker-compose.yml` and set `MONGO_URL` in `.env` to the Atlas URI.
4. Use Docker secrets or your platform's secret manager for `JWT_SECRET`
   and `ADMIN_PASSWORD` — never commit `.env`.

## Just want one image?

The backend and frontend Dockerfiles each build standalone. Examples:

```bash
# Backend only
docker build -t habio-backend ./backend
docker run -p 8001:8001 \
  -e MONGO_URL=mongodb://host.docker.internal:27017 \
  -e DB_NAME=habio \
  -e JWT_SECRET=$(openssl rand -hex 32) \
  habio-backend

# Frontend only (point at any backend URL)
docker build \
  --build-arg REACT_APP_BACKEND_URL=https://api.example.com \
  -t habio-frontend ./frontend
docker run -p 3000:80 habio-frontend
```
