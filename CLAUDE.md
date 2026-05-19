# CLAUDE.md - Momentum

This file is the working guide for contributors and coding agents in this repository.

## 1. Project Overview

Momentum is a full-stack productivity and performance app.

- Frontend: `client/` (React + Vite + React Query + Tailwind)
- Backend: `server/` (Express + Prisma + PostgreSQL)
- Auth: JWT in `httpOnly` cookie named `token`
- AI planner: Groq-backed Llama integration

Momentum tracks study, workout, nutrition, sleep, focus, mood, and screen time.

## 2. Source Of Truth

When documentation and code disagree, treat these as authoritative:

1. `server/prisma/schema.prisma`
2. `server/src/routes/*` + `server/src/controllers/*`
3. `client/src/api/*` and `client/src/pages/*`

Do not assume older docs are still correct.

## 3. Current Backend API Surface

Base URL (dev): `http://localhost:3000/api`

Public:
- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`

Protected:
- `GET /auth/me`
- `GET/PATCH /profile`
- `PATCH /profile/password`
- `GET/POST/PATCH/DELETE /targets`
- `GET/POST/PATCH/DELETE /study`
- `GET/POST/PATCH/DELETE /workout`
- `GET/POST/PATCH/DELETE /nutrition`
- `GET/POST/PATCH/DELETE /sleep`
- `GET/POST/PATCH/DELETE /focus`
- `GET/POST/PATCH/DELETE /mood`
- `GET/POST/PATCH/DELETE /screentime`
- `GET /analytics/summary`
- `GET /analytics/trends`
- `GET /analytics/mood-trends`
- `GET /analytics/focus-trends`
- `GET /analytics/screentime-breakdown`
- `GET /analytics/productivity-score`
- `GET /export/study|workout|nutrition|sleep|all`
- `GET /ai/context`
- `POST /ai/chat`

Rate limiting is enabled globally and stricter on auth endpoints.

## 4. Current Frontend Route Surface

Public routes:
- `/login`
- `/register`

Protected app routes:
- `/dashboard`
- `/targets`
- `/study`
- `/workout`
- `/nutrition`
- `/sleep`
- `/focus`
- `/mood`
- `/screentime`
- `/analytics`
- `/ai-planner`

## 5. Data Model Highlights

Main models in Prisma:
- `User`
- `DailyTarget`
- `StudySession`
- `WorkoutLog`
- `NutritionLog`
- `FocusSession`
- `MoodLog`
- `ScreenTimeLog`
- `Notification`

Important behavior:
- Sleep values are stored in `DailyTarget` (`sleepHoursGoal`, `sleepHoursActual`).
- Study/workout/nutrition writes sync target actuals through `dailyTargetSyncService`.

## 6. Implementation Conventions

- Use `async/await` with `try/catch` around async boundaries.
- Keep API responses in the standard envelope:
  - success: `{ success: true, data, message }`
  - error: `{ success: false, error, code? }`
- In frontend, use `client/src/api/axios.js` instance for all API calls.
- Use React Query for server state on pages.
- Follow existing UI patterns in `Study.jsx` and `Workout.jsx` for tracker pages.

## 7. Environment Variables

Backend expected `.env` keys:

- `DATABASE_URL`
- `JWT_SECRET`
- `PORT` (optional, default `3000`)
- `CLIENT_URL` (optional, default `http://localhost:5173`)
- `NODE_ENV`
- `GROQ_API_KEY`
- `GROQ_MODEL` (optional, default `llama-3.1-8b-instant`)

Frontend can use `VITE_API_URL`; fallback is `http://localhost:3000/api`.

## 8. Useful Commands

Backend:
```bash
cd server
npm install
npm run dev
npm test
```

Frontend:
```bash
cd client
npm install
npm run dev
npm run build
```

Prisma:
```bash
cd server
npx prisma migrate dev
```

## 9. Known Risks

- `authController.getMe` selects `created_at`, while Prisma uses `createdAt`. This can cause `/auth/me` failures.
- `AIPlanner.jsx` still reads `res.data.response` for `/ai/chat`, but backend returns `res.data.data.response`.
- Build warning exists for large frontend chunk size.

## 10. Maintenance Notes

- Keep this document aligned with live code.
- Do not add speculative endpoints or aspirational schema snippets.
- If backend/frontend contract changes, update this file and `HANDOFF.md` in the same PR.
