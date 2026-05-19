# Momentum Handoff

This handoff reflects the current state of the repository as of 2026-05-18 after frontend integration fixes for analytics/targets and new tracker pages.

## 1. Current Project Status

- Momentum is a full-stack app with React/Vite frontend in `client/` and Express/Prisma backend in `server/`.
- Backend is feature-rich and includes auth, profile, notifications, targets, study, workout, nutrition, sleep, focus, mood, screentime, analytics, exports, and AI planner routes.
- Frontend includes app shell, auth, dashboard, targets, study, workout, nutrition, sleep, focus, mood, screentime, analytics, and AI planner pages.
- Frontend production build currently passes (`npm run build`), with only a large chunk warning.

## 2. Backend Summary

Entrypoints:
- `server/src/index.js`
- `server/src/app.js`

Runtime:
- API base path: `/api`
- Default dev port: `3000`

Auth:
- JWT cookie auth (`token`)
- `GET /api/auth/me` is implemented

Rate limits:
- General: 100 requests / 15 min
- Auth (`register`, `login`): 10 requests / 15 min

Key route groups:
- `auth`, `profile`, `notifications`
- `targets`, `study`, `workout`, `nutrition`, `sleep`, `focus`, `mood`, `screentime`
- `analytics`
- `export`
- `ai` (`/context`, `/chat`)

AI planner backend:
- Controller: `server/src/controllers/aiPlannerController.js`
- Service: `server/src/services/aiPlannerService.js`
- Provider: Groq (OpenAI-compatible API)

## 3. Frontend Summary

Current page set in `client/src/pages`:
- `Dashboard`, `Targets`, `Study`, `Workout`, `Nutrition`, `Sleep`
- `Focus`, `Mood`, `Screentime`
- `Analytics`, `AIPlanner`, `Login`, `Register`

Current API wrappers in `client/src/api`:
- `auth`, `targets`, `study`, `workout`, `nutrition`, `sleep`
- `focus`, `mood`, `screentime`, `analytics`, `ai`

Routing:
- Public: `/login`, `/register`
- Protected: `/dashboard`, `/targets`, `/study`, `/workout`, `/nutrition`, `/sleep`, `/focus`, `/mood`, `/screentime`, `/analytics`, `/ai-planner`

Recent frontend alignment work completed:
- Analytics page now sends ISO `startDate`/`endDate` and consumes current backend summary/trend shapes.
- Targets page now shows actual progress derived from logs (study/workout/nutrition), with target counters as fallback.
- New Focus, Mood, and Screentime pages implemented and added to sidebar/mobile navigation.

## 4. Database Models

Prisma models in `server/prisma/schema.prisma`:
- `User`
- `DailyTarget`
- `StudySession`
- `WorkoutLog`
- `NutritionLog`
- `FocusSession`
- `MoodLog`
- `ScreenTimeLog`
- `Notification`

Notes:
- Sleep is represented in `DailyTarget` fields (`sleepHoursGoal`, `sleepHoursActual`).
- Study/workout/nutrition writes sync daily target actuals using `dailyTargetSyncService`.

## 5. Environment Variables

Backend (`server/.env`):
```env
DATABASE_URL=postgresql://user:password@localhost:5432/momentum
JWT_SECRET=replace_with_a_long_secret
PORT=3000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
GROQ_API_KEY=your_groq_api_key
# optional:
GROQ_MODEL=llama-3.1-8b-instant
```

Frontend:
- Optional `VITE_API_URL` override; otherwise falls back to `http://localhost:3000/api`.

## 6. Runbook

Install:
```bash
cd server && npm install
cd ../client && npm install
```

Migrate DB:
```bash
cd server
npx prisma migrate dev
```

Start backend:
```bash
cd server
npm run dev
```

Start frontend:
```bash
cd client
npm run dev
```

Verification:
```bash
cd server
npm test

cd ../client
npm run build
```

## 7. Remaining Work / Known Gaps

- `server/src/controllers/authController.js` currently selects `created_at` in `getMe`, but Prisma field is `createdAt`; this may break `/api/auth/me` depending on runtime path coverage.
- `client/src/pages/AIPlanner.jsx` reads `/ai/chat` response as `res.data.response`; backend returns `res.data.data.response`.
- Some UI strings contain mojibake bullet characters from legacy copy/paste (`•`), worth cleanup.
- Frontend bundle is large; optional code-splitting can reduce warning noise.

## 8. Repo Hygiene Notes

Potentially non-product artifacts exist at repo root (tooling/state files). Review before deletion:
- `.runlogs/`
- `.claude-flow/`
- `.swarm/`
- `ruvector.db`
- `.mcp.json`

Only remove these if your team does not rely on local Codex/Claude tooling state.
