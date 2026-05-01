# HabitQuest — Product Requirements Document

## Original Problem Statement
"Please build me an app that allows you to track habits and tasks that rewards you with coins that can be traded for user defined rewards"

## User Choices (confirmed)
- Auth: JWT email/password
- Habits = recurring (daily/weekly), Tasks = one-time to-dos
- Coins earned: difficulty-based (Easy=5, Medium=10, Hard=20) OR custom amount
- User-defined rewards with coin cost + redemption history log
- Design vibe: Playful & gamified (Neo-brutalist "HabitQuest" theme)

## User Personas
- Self-improver: builds daily routines, needs streak motivation
- Productivity gamer: enjoys earning/spending coins for small treats
- Parent/Coach (future): managing habits for others

## Architecture
- **Backend**: FastAPI + MongoDB (Motor async). All routes prefixed `/api`. JWT (HS256) via `Authorization: Bearer` header (also cookie). Bcrypt password hashing.
- **Frontend**: React 19 + React Router 7 + Tailwind + shadcn/ui + Sonner toasts. Auth via AuthContext; token in `localStorage` (`hq_token`).
- **Theme**: Outfit + Nunito fonts, neo-brutalist chunky shadows, colors: coral `#EF476F`, yellow `#FFD166`, mint `#06D6A0`, blue `#118AB2`.

## MongoDB Collections
- `users` (id, email, password_hash, name, coin_balance, created_at)
- `habits` (id, user_id, name, description, frequency, difficulty, custom_coins, coins_per_completion, streak, longest_streak, last_completed_date, completions[], total_completions, created_at)
- `tasks` (id, user_id, name, description, difficulty, custom_coins, coins_reward, completed, completed_at, due_date, created_at)
- `rewards` (id, user_id, name, description, cost, times_redeemed, icon, created_at)
- `redemptions` (id, user_id, reward_id, reward_name, cost, redeemed_at)
- `transactions` (id, user_id, amount, type earn|spend, source, source_id, description, created_at)

## API Endpoints (all under `/api`)
- `POST /auth/register` · `POST /auth/login` · `POST /auth/logout` · `GET /auth/me`
- Habits: `GET/POST /habits`, `PUT/DELETE /habits/{id}`, `POST /habits/{id}/complete`
- Tasks: `GET/POST /tasks`, `PUT/DELETE /tasks/{id}`, `POST /tasks/{id}/complete`, `POST /tasks/{id}/uncomplete`
- Rewards: `GET/POST /rewards`, `PUT/DELETE /rewards/{id}`, `POST /rewards/{id}/redeem`
- `GET /redemptions` · `GET /transactions` · `GET /stats`

## Implemented (2026-04-30)
- Full JWT auth (register/login/logout/me) with bcrypt + seed admin
- Habits CRUD with streak tracking, blocks double-complete per day
- Tasks CRUD with complete/uncomplete (refunds coins)
- Rewards CRUD with redeem flow, insufficient-balance guard
- Redemption history + coin ledger (transactions)
- Stats endpoint (balance, total earned, best streak, tasks done)
- Responsive mobile nav with coin-balance indicator
- Playful neo-brutalist UI (Outfit/Nunito, chunky shadows, difficulty badges)
- Toast notifications (sonner) for success/error feedback
- Data-testid attributes across all interactive elements

## Backlog (next)
- P0: None — core loop complete.
- P1:
  - Confetti/particle burst on habit/task completion
  - Habit completion history heatmap (year view)
  - Daily/weekly "quest" goals with bonus coins
  - Export data (JSON/CSV)
- P2:
  - PWA installable + offline support
  - Multi-user household mode with shared rewards
  - Social sharing card for milestones
  - Achievements/badges system (e.g., "7-day streak", "100 coins earned")
  - Dark mode toggle
  - Recurring tasks (snooze / repeat)

## Test Credentials
See `/app/memory/test_credentials.md`
