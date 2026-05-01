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
