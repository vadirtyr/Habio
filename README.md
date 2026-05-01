# Habio

A playful, gamified habit & task tracker that rewards you with coins you can
spend on rewards you define yourself. Build streaks, complete daily quests,
unlock achievements, and treat yourself.

> Built with FastAPI · React · MongoDB · Tailwind · shadcn/ui

---

## Features
- **Habits** (recurring daily/weekly) with streak tracking and a 12-week heatmap (52-week in detail view)
- **Tasks** (one-time or recurring) with difficulty-based or custom coin rewards
- **Rewards shop** — define your own rewards and redeem with earned coins
- **Daily & Weekly Quests** for bonus coins
- **Achievements** with `earned_at` timestamps and first-unlock confetti
- **Coin ledger** + redemption history
- **JWT email/password auth** (httpOnly cookies, no localStorage tokens)
- **Light & dark mode** with a neo-brutalist playful theme

---

## Running with Docker (recommended)

The repo ships with a complete Docker setup: FastAPI backend, React frontend
served by nginx, and MongoDB — wired together with docker-compose.

### Prerequisites
- Docker 20+ and Docker Compose v2

### Quick start

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

The first build takes a few minutes (yarn install + react build). Subsequent
`up` commands are fast thanks to Docker layer caching.

### Service map
| Service  | Port  | Description                          |
|----------|-------|--------------------------------------|
| frontend | 3000  | React app served by nginx            |
| backend  | 8001  | FastAPI (uvicorn)                    |
| mongodb  | 27017 | MongoDB 7 with persisted volume      |

### Common commands

```bash
docker compose logs -f backend     # tail backend logs
docker compose logs -f frontend    # tail nginx access/error logs
docker compose restart backend     # restart only backend
docker compose down                # stop everything (data persists)
docker compose down -v             # stop AND wipe Mongo data
```

### Production notes

1. **`REACT_APP_BACKEND_URL`** is baked at build time. If you change it,
   rebuild the frontend image: `docker compose build frontend`.
2. Put a reverse proxy (Caddy / Traefik / Nginx) in front of the backend for
   HTTPS, and update `CORS_ORIGINS` to your real frontend origin.
3. For managed Mongo (Atlas etc.), remove the `mongodb` service from
   `docker-compose.yml` and set `MONGO_URL` in `.env` to the Atlas URI.
4. Use Docker secrets or your platform's secret manager for `JWT_SECRET` and
   `ADMIN_PASSWORD` — never commit `.env`.

### Building images individually

The backend and frontend Dockerfiles each build standalone:

```bash
# Backend only — point MONGO_URL at any reachable Mongo.
# Example: a Mongo container on the same Docker network.
docker network create habio-net 2>/dev/null || true
docker run -d --name habio-mongo --network habio-net -p 27017:27017 mongo:7

docker build -t habio-backend ./backend
docker run -d --name habio-backend --network habio-net -p 8001:8001 \
  -e MONGO_URL=mongodb://habio-mongo:27017 \
  -e DB_NAME=habio \
  -e JWT_SECRET=$(openssl rand -hex 32) \
  habio-backend

# Frontend only (point at any backend URL)
docker build \
  --build-arg REACT_APP_BACKEND_URL=https://api.example.com \
  -t habio-frontend ./frontend
docker run -d --name habio-frontend -p 3000:80 habio-frontend
```

> **Tip — talking to a Mongo on the host machine:** `host.docker.internal`
> only resolves automatically on Docker Desktop (Mac/Windows). On **Linux**
> add `--add-host=host.docker.internal:host-gateway` to the `docker run`
> command so the hostname maps to your host's gateway IP.

See **[DOCKER.md](./DOCKER.md)** for more details.

---

## Single-image deploy (Railway / Render / Fly / Cloud Run)

The repo also ships with a **root `Dockerfile`** that bundles everything
into one container — perfect for platforms that pull a single image:

- nginx serves the React build on `$PORT` (auto-detected)
- nginx reverse-proxies `/api/*` to a local uvicorn worker on `:8001`
- supervisord keeps both processes alive
- Mongo is **not** included — point `MONGO_URL` at a managed instance (e.g. Atlas)

```bash
# Local test (single command)
docker build -t habio .
docker run -d \
  --name habio \
  -p 8080:8080 \
  -e MONGO_URL="mongodb+srv://..." \
  -e DB_NAME=habio \
  -e JWT_SECRET=$(openssl rand -hex 32) \
  -e ADMIN_EMAIL=you@example.com \
  -e ADMIN_PASSWORD=strongpass \
  habio

open http://localhost:8080
```

Or run it with Mongo via compose (no external DB needed):

```bash
cp .env.example .env     # fill in JWT_SECRET, ADMIN_*
docker compose -f docker-compose.single.yml up --build -d
open http://localhost:8080
```

### Three ways to run Habio — pick one

| # | Command | What it gives you | When to use |
|---|---------|-------------------|-------------|
| 1 | `docker run -d --name habio -p 8080:8080 … habio` | 1 container, named `habio`, on port 8080. You supply `MONGO_URL` (Atlas etc.) | Fastest — you already have a managed Mongo. |
| 2 | `docker compose -f docker-compose.single.yml up -d` | 2 containers: `habio` + `habio-mongo` (local persisted DB) | Most convenient local/self-hosted run. **Recommended.** |
| 3 | `docker compose up -d` | 3 containers: `habio-backend`, `habio-frontend`, `habio-mongo` (separate images) | Active development — iterate on one service at a time. |

### Troubleshooting run issues

**Port column empty in Docker Desktop / `curl` fails:**
You probably ran `docker run habio` without `-p`. The `EXPOSE 8080` directive
is documentation only — you **must** publish the port explicitly:

```bash
docker run -d --name habio -p 8080:8080 … habio
```

**Container has a random name (e.g. `fervent_allen`):**
Pass `--name habio`, or use one of the compose files which set
`container_name:` for you.

**Container already exists, can't reuse the name:**

```bash
docker ps -a                 # list all containers (including stopped)
docker rm -f <id-or-name>    # remove the old one
```

Then re-run with the correct flags.

**`ServerSelectionTimeoutError: host.docker.internal:27017: Name or service not known`:**
The backend can't reach your Mongo. On **Linux** (and sometimes in CI),
`host.docker.internal` isn't resolvable by default. Two quick fixes:

1. **Use a Mongo container on the same Docker network** (no host-networking needed):
   ```bash
   docker network create habio-net
   docker run -d --name habio-mongo --network habio-net mongo:7
   docker run -d --name habio --network habio-net -p 8080:8080 \
     -e MONGO_URL=mongodb://habio-mongo:27017 \
     -e JWT_SECRET=$(openssl rand -hex 32) \
     habio
   ```
2. **Keep using `host.docker.internal`** but add the host-gateway mapping:
   ```bash
   docker run … --add-host=host.docker.internal:host-gateway …
   ```

Or easiest of all — use `docker-compose.single.yml`, which wires Mongo up
for you on a shared network automatically.

When deploying:
- **Railway / Render / Fly** auto-detect the root `Dockerfile` and inject `$PORT`.
- **Cloud Run** — `gcloud run deploy --source .` works out of the box.
- Set the same env vars (`MONGO_URL`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`) in your platform's dashboard.

---

## Local development (without Docker)

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # then edit values
uvicorn server:app --reload --port 8001
```

Required env vars (see `.env.example`):
- `MONGO_URL` — e.g. `mongodb://localhost:27017`
- `DB_NAME` — any string
- `JWT_SECRET` — `openssl rand -hex 32`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` — seeded admin account
- `CORS_ORIGINS` — comma-separated origins or `*`

### Frontend

```bash
cd frontend
yarn install
yarn start
```

Set `REACT_APP_BACKEND_URL` in `frontend/.env` to point at your backend.

---

## Project structure

```
/
├── backend/             # FastAPI app
│   ├── server.py        # all routes + models
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/            # React app (CRA + craco)
│   ├── src/
│   │   ├── pages/       # Login, Register, Dashboard, Habits, Tasks,
│   │   │                # Rewards, Quests, Achievements, History
│   │   ├── components/  # Reusable UI (HabitCard, TaskRow, RewardCard,
│   │   │                # ItemFormPanel, HabitHeatmap, Layout, …)
│   │   ├── context/     # AuthContext, ThemeContext
│   │   └── lib/         # api.js, confetti.js
│   ├── nginx.conf       # SPA + asset cache rules for the prod image
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── DOCKER.md
```

---

## API overview

All routes are prefixed with `/api`.

| Group         | Endpoints |
|---------------|-----------|
| Auth          | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| Habits        | `GET/POST /habits`, `PUT/DELETE /habits/:id`, `POST /habits/:id/complete` |
| Tasks         | `GET/POST /tasks`, `PUT/DELETE /tasks/:id`, `POST /tasks/:id/complete`, `POST /tasks/:id/uncomplete` |
| Rewards       | `GET/POST /rewards`, `PUT/DELETE /rewards/:id`, `POST /rewards/:id/redeem` |
| Quests        | `GET /quests`, `POST /quests/:id/claim` |
| Achievements  | `GET /achievements` |
| History       | `GET /redemptions`, `GET /transactions` |
| Stats         | `GET /stats` |

Tasks support `recurrence: "none" \| "daily" \| "weekly"` — completing a
recurring task automatically schedules the next occurrence.

---

## License

MIT
