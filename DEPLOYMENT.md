# Deployment Guide

This guide reflects the current Momentum codebase: a React/Vite client in `client/`, an Express API in `server/`, Prisma ORM, and PostgreSQL.

## 1. Prerequisites

- Node.js `20.19+` minimum for the current Vite version; use a supported LTS release in production.
- A PostgreSQL database, such as Neon.
- A Git-hosted repository with the `client/` and `server/` apps available as separate deploy targets.
- Production environment variables prepared before the first deploy.

## 2. Backend deployment

Render is a straightforward fit for the Express server.

1. Create a new **Web Service** from the repository.
2. Set the service root directory to `server`.
3. Use:
   - Build command: `npm install`
   - Start command: `npm start`
4. Set the production environment variables listed below.
5. Add a pre-deploy step for migrations:

```bash
npx prisma migrate deploy
```

6. Deploy and verify:
   - `GET /`
   - `GET /api/health`

Railway works similarly: deploy `server/` as its own service, set the root directory, use the Node start command, and run migrations as a pre-deploy command.

## 3. Frontend deployment

Vercel or Netlify can host the Vite frontend.

### Vercel

1. Import the repository as a project.
2. Set the project root directory to `client`.
3. Use the detected Vite build, or set:
   - Build command: `npm run build`
   - Output directory: `dist`

### Netlify

1. Create a new site from the repository.
2. Set the base directory to `client`.
3. Use:
   - Build command: `npm run build`
   - Publish directory: `dist`

### Important current-project note

`client/src/api/axios.js` currently hardcodes `http://localhost:3000/api`. Before a real production launch, update the client to use the deployed API origin or deploy frontend/backend behind one origin. No frontend environment variables are wired into the app today.

## 4. Database: Neon PostgreSQL

1. Create a Neon project and database.
2. Copy the production connection string from the Neon dashboard.
3. Set that value as backend `DATABASE_URL`.
4. Start with a direct connection string for this codebase, because `prisma.config.ts` currently reads only `DATABASE_URL`.
5. If you later move to Neon's pooled connection string, add a separate direct migration connection and adjust Prisma configuration so migrations still use a direct URL.

## 5. Production environment variables

### Required backend variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string used by Prisma and the app. |
| `JWT_SECRET` | Secret used to sign and verify auth JWTs. |
| `CLIENT_URL` | Exact public frontend origin allowed by CORS. |
| `NODE_ENV` | Set to `production` so auth cookies use secure mode. |

### Platform-managed or optional variables

| Variable | Notes |
|---|---|
| `PORT` | Most hosts inject this automatically; the server already reads `process.env.PORT || 3000`. |
| `ANTHROPIC_API_KEY` | Reserve for future AI backend work; no current backend code reads it. |
| `NODE_VERSION` | Set on the host if you want deterministic Node runtime selection. |

### Frontend variables

None are consumed by the current client build. If the API URL is later externalized, use a Vite-prefixed variable such as `VITE_API_BASE_URL` and wire it into the client code first.

## 6. Running Prisma migrations in production

Use production migrations, not development migrations:

```bash
cd server
npx prisma migrate deploy
```

Run this in CI/CD or a platform pre-deploy step so schema changes land before the new server starts serving traffic. Commit the Prisma migration history to source control.

## 7. Common deployment issues and fixes

| Issue | Likely cause | Fix |
|---|---|---|
| Backend deploys but frontend still calls localhost | Hardcoded API base URL in `client/src/api/axios.js` | Point the client at the production API before launch. |
| Browser requests fail with CORS errors | `CLIENT_URL` does not match the deployed frontend origin | Set `CLIENT_URL` to the exact production origin. |
| Login works inconsistently across separate frontend/backend domains | Cookie-auth setup is currently optimized for same-site behavior | Prefer a same-site deployment pattern or review cookie/CORS settings before production. |
| Backend fails to boot on host | Wrong start command or service rooted at repo root instead of `server/` | Deploy `server/` as the service root and use `npm start`. |
| Prisma tables are missing in production | Migrations were not run | Run `npx prisma migrate deploy` against the production database. |
| Neon connection timeouts after idle periods | Neon compute cold start / short connection timeout | Increase connection timeout settings if needed and review Neon connection behavior. |
| App builds but auth persistence is still broken after refresh | Frontend calls `/api/auth/me`, but backend does not currently implement it | Resolve this existing product gap before calling the deployment complete. |

## 8. Post-deployment checklist

- [ ] Backend root endpoint returns successfully.
- [ ] `GET /api/health` reports a connected database.
- [ ] Registration, login, logout, and a protected route work in the deployed browser.
- [ ] CORS is limited to the real frontend origin.
- [ ] `NODE_ENV=production` is set.
- [ ] `JWT_SECRET` is a long production secret, not the development fallback.
- [ ] Prisma migrations are applied in production.
- [ ] Frontend requests target the deployed backend, not localhost.
- [ ] Analytics and export endpoints still require authentication.
- [ ] Logs show no startup errors, migration failures, or database connection churn.
